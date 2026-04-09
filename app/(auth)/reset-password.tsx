import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppTextField, Screen } from '@/components/ui';
import {
  isFormValid,
  useAuth,
  validateNewPassword,
  validatePasswordMatch,
  visibleAuthFieldError,
} from '@/features/auth';
import { updatePassword } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, spacing, typography } from '@/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [confirmBlurred, setConfirmBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const passErr = useMemo(() => validateNewPassword(password), [password]);
  const matchErr = useMemo(
    () => (password ? validatePasswordMatch(password, confirm) : null),
    [password, confirm],
  );
  const passVisible = visibleAuthFieldError(passErr, passwordBlurred, submitAttempted);
  const matchVisible = visibleAuthFieldError(matchErr, confirmBlurred, submitAttempted);

  async function onSubmit() {
    setError(null);
    const pErr = validateNewPassword(password);
    const mErr = validatePasswordMatch(password, confirm);
    if (!isFormValid([pErr, mErr])) {
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
      const result = await updatePassword(client, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      clearPasswordRecovery();
      router.replace('/portfolio');
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
      <Text style={styles.title}>Set a new password</Text>
      <Text style={styles.subtitle}>
        {isPasswordRecovery
          ? 'Choose a strong password you have not used here before.'
          : 'If you opened this screen without a reset link, request a new email from Forgot password.'}
      </Text>

      <View style={styles.form}>
        <AppTextField
          label="New password"
          variant="filled"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setPasswordBlurred(true)}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          errorMessage={passVisible}
        />
        <AppTextField
          label="Confirm password"
          variant="filled"
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => setConfirmBlurred(true)}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          errorMessage={matchVisible}
        />
        <Text style={styles.hint}>
          At least 8 characters, including 1 uppercase letter, 1 number, and 1 symbol.
        </Text>
        {error ? <Text style={styles.banner}>{error}</Text> : null}
        <AppButton
          label="Update password"
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting}
        />
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
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  banner: {
    ...typography.caption,
    color: colors.danger,
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
