import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppTextField, Screen } from '@/components/ui';
import { isFormValid, useAuth, validateEmail } from '@/features/auth';
import { requestPasswordReset } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, hitSlop, spacing, typography } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailErr = useMemo(() => validateEmail(email), [email]);
  const canSubmit = isFormValid([emailErr]) && isConfigured;

  async function onSubmit() {
    setError(null);
    const eErr = validateEmail(email);
    if (eErr) {
      setError(eErr);
      return;
    }

    const client = tryGetSupabaseClient();
    if (!client) {
      setError('Supabase is not configured.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestPasswordReset(client, email.trim());
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      scroll
      keyboardAvoiding
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <Pressable onPress={() => router.back()} hitSlop={hitSlop}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.subtitle}>
        We&apos;ll email you a secure link to choose a new password. It expires after a short time.
      </Text>

      <View style={styles.form}>
        {success ? (
          <Text style={styles.success}>
            If an account exists for that email, you&apos;ll receive reset instructions shortly.
            You can close this screen after you&apos;re done.
          </Text>
        ) : (
          <>
            <AppTextField
              label="Email"
              variant="filled"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              textContentType="emailAddress"
              errorMessage={emailErr ?? undefined}
            />
            {error ? <Text style={styles.banner}>{error}</Text> : null}
            <AppButton
              label="Send reset link"
              onPress={onSubmit}
              loading={submitting}
              disabled={!canSubmit || submitting}
            />
          </>
        )}
      </View>

      <Pressable
        onPress={() => router.replace('/sign-in')}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
      >
        <Text style={styles.link}>Back to Sign In</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    ...typography.bodyMedium,
    color: colors.accentCta,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.screenTitleSmall,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  banner: {
    ...typography.caption,
    color: colors.danger,
  },
  success: {
    ...typography.bodySecondary,
    color: colors.success,
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
