import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextField, AuthFormHeader, PrimaryButton, Screen } from '@/components/ui';
import {
  isFormValid,
  useAuth,
  validateEmail,
  validatePasswordSignIn,
  visibleAuthFieldError,
} from '@/features/auth';
import { signInWithEmail } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, hitSlop, iconSizes, layout, semantic, spacing, textPresets } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailErr = useMemo(() => validateEmail(email), [email]);
  const passErr = useMemo(() => validatePasswordSignIn(password), [password]);
  const emailVisible = visibleAuthFieldError(emailErr, emailBlurred, submitAttempted);
  const passVisible = visibleAuthFieldError(passErr, passwordBlurred, submitAttempted);

  function onClose() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function onSubmit() {
    setError(null);
    const eErr = validateEmail(email);
    const pErr = validatePasswordSignIn(password);
    if (!isFormValid([eErr, pErr])) {
      setSubmitAttempted(true);
      return;
    }

    const client = tryGetSupabaseClient();
    if (!client) {
      setError('Supabase is not configured. Add keys in `.env` and restart Metro.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signInWithEmail(client, email.trim(), password);
      if (!result.ok) {
        if (result.code === 'email_not_confirmed') {
          router.replace({
            pathname: '/verify-email-pending',
            params: { email: email.trim() },
          });
          return;
        }
        setError(result.message);
        return;
      }
      router.replace('/portfolio');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      scroll
      keyboardAvoiding
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      safeAreaEdges={['top', 'left', 'right']}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.inner}>
        <AuthFormHeader title="Sign In" onClose={onClose} />

        <View style={styles.form}>
          <AppTextField
            label="Email"
            variant="outline"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailBlurred(true)}
            autoComplete="email"
            textContentType="emailAddress"
            errorMessage={emailVisible}
            leftAccessory={
              <Ionicons name="mail-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />

          <View style={styles.forgotRow}>
            <View style={styles.forgotSpacer} />
            <Pressable
              onPress={() => router.push('/forgot-password')}
              hitSlop={hitSlop}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>

          <AppTextField
            label="Password"
            variant="outline"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setPasswordBlurred(true)}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            errorMessage={passVisible}
            leftAccessory={
              <Ionicons name="lock-closed-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />

          <View style={styles.errorSlot}>
            {error ? <Text style={styles.banner}>{error}</Text> : null}
          </View>

          <PrimaryButton
            label="Sign In"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting || !isConfigured}
            style={styles.submit}
          />
        </View>

        <View style={styles.spacer} />

        <Pressable
          onPress={() => router.replace('/create-account')}
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          <Text style={styles.footerText}>
            Don&apos;t have an account? <Text style={styles.footerEm}>Create Account</Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: layout.listContentBottom,
  },
  inner: {
    flexGrow: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  form: {
    gap: spacing.md,
  },
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginBottom: spacing.xxs,
  },
  forgotSpacer: {
    flex: 1,
  },
  link: {
    ...textPresets.bodySecondary,
    fontSize: 15,
    fontWeight: '500',
    color: semantic.accentGold,
  },
  errorSlot: {
    minHeight: 22,
    justifyContent: 'center',
  },
  banner: {
    ...textPresets.caption,
    color: colors.danger,
  },
  submit: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  spacer: {
    flexGrow: 1,
    minHeight: spacing.xl,
  },
  footer: {
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...textPresets.bodySecondary,
    textAlign: 'center',
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  footerEm: {
    color: semantic.accentGold,
    fontWeight: '600',
  },
});
