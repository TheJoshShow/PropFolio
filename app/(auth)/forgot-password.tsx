import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppBackButton, AppHeader, HeaderActionSpacer } from '@/components/navigation';
import { AppButton, AppTextField, Screen } from '@/components/ui';
import { useAuth, validateEmail, visibleAuthFieldError } from '@/features/auth';
import { requestPasswordReset } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, spacing, typography } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailErr = useMemo(() => validateEmail(email), [email]);
  const emailVisible = visibleAuthFieldError(emailErr, emailBlurred, submitAttempted);

  async function onSubmit() {
    setError(null);
    const eErr = validateEmail(email);
    if (eErr) {
      setSubmitAttempted(true);
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
      <AppHeader
        omitRowPadding
        title="Forgot password"
        showDivider={false}
        style={{ marginBottom: spacing.md }}
        left={<AppBackButton onPress={() => router.back()} testID="propfolio.forgotPassword.back" />}
        right={<HeaderActionSpacer />}
      />
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
              onBlur={() => setEmailBlurred(true)}
              autoComplete="email"
              textContentType="emailAddress"
              errorMessage={emailVisible}
            />
            {error ? <Text style={styles.banner}>{error}</Text> : null}
            <AppButton
              label="Send reset link"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting || !isConfigured}
            />
          </>
        )}
      </View>

      <Pressable onPress={() => router.replace('/sign-in')} style={styles.footer}>
        <Text style={styles.link}>Back to Sign In</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
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
    paddingBottom: spacing.lg,
  },
  link: {
    ...typography.bodyMedium,
    color: colors.accentCta,
  },
});
