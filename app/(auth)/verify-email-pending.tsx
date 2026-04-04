import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { resendSignupConfirmation } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, spacing, typography } from '@/theme';

export default function VerifyEmailPendingScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const emailFromParam = Array.isArray(emailParam) ? emailParam[0] : emailParam;
  const { user, signOut, isSignedIn, needsEmailVerification } = useAuth();

  const displayEmail = user?.email ?? emailFromParam ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onResend() {
    setError(null);
    setMessage(null);
    const target = displayEmail.trim();
    if (!target) {
      setError('We need your email to resend confirmation. Go back and sign up again.');
      return;
    }
    const client = tryGetSupabaseClient();
    if (!client) {
      setError('Supabase is not configured.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await resendSignupConfirmation(client, target);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage('Confirmation email sent. Check your inbox and spam folder.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Confirm your email</Text>
      <Text style={styles.subtitle}>
        {needsEmailVerification && isSignedIn
          ? 'Your account is almost ready. Tap the link in the email we sent to unlock PropFolio.'
          : 'We sent a confirmation link. Open it on this device so we can verify your account.'}
      </Text>
      {displayEmail ? (
        <Text style={styles.email} selectable>
          {displayEmail}
        </Text>
      ) : null}

      <Text style={styles.creditsNote}>
        When your account is created we add 3 import credits once: 2 signup bonus and 1 for your first billing cycle.
        You will see your balance after sign-in. Monthly included credits and extra packs require an active membership
        ($1.99/mo after a free first month via Apple).
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <View style={styles.actions}>
        <AppButton label="Resend email" onPress={onResend} loading={submitting} disabled={submitting} />
        <AppButton label="Sign out" variant="secondary" onPress={onSignOut} />
      </View>

      <Pressable onPress={() => router.replace('/sign-in')} style={styles.footer}>
        <Text style={styles.link}>Back to Sign In</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitleSmall,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.lg,
  },
  email: {
    ...typography.bodyMedium,
    marginBottom: spacing.md,
  },
  creditsNote: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  success: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  link: {
    ...typography.bodyMedium,
    color: colors.accentCta,
  },
});
