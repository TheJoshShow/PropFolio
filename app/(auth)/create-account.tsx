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
  validateFullName,
  validateNewPassword,
} from '@/features/auth';
import { signUpWithEmail } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, iconSizes, layout, semantic, spacing, textPresets } from '@/theme';

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isConfigured } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameErr = useMemo(() => validateFullName(name), [name]);
  const emailErr = useMemo(() => validateEmail(email), [email]);
  const passErr = useMemo(() => validateNewPassword(password), [password]);
  const canSubmit = isFormValid([nameErr, emailErr, passErr]) && isConfigured;

  function onClose() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function onSubmit() {
    setError(null);
    const nErr = validateFullName(name);
    const eErr = validateEmail(email);
    const pErr = validateNewPassword(password);
    if (!isFormValid([nErr, eErr, pErr])) {
      setError(nErr ?? eErr ?? pErr ?? 'Check the form and try again.');
      return;
    }

    const client = tryGetSupabaseClient();
    if (!client) {
      setError('Supabase is not configured. Add keys in `.env` and restart Metro.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUpWithEmail(client, email.trim(), password, name.trim());
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.data.sessionActive) {
        router.replace('/portfolio');
        return;
      }
      router.replace({
        pathname: '/verify-email-pending',
        params: { email: email.trim() },
      });
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
        <AuthFormHeader title="Create Account" onClose={onClose} />

        <View style={styles.form}>
          <AppTextField
            label="Name"
            variant="outline"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            errorMessage={nameErr ?? undefined}
            leftAccessory={
              <Ionicons name="person-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />
          <AppTextField
            label="Email"
            variant="outline"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
            textContentType="emailAddress"
            errorMessage={emailErr ?? undefined}
            leftAccessory={
              <Ionicons name="mail-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />
          <AppTextField
            label="Password"
            variant="outline"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="password-new"
            errorMessage={passErr ?? undefined}
            leftAccessory={
              <Ionicons name="lock-closed-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />
          <Text style={styles.hint}>Use at least 8 characters with a letter and a number.</Text>
          <Text style={styles.creditsExplainer}>
            After signup you receive 3 import credits on our servers: 2 signup bonus credits and 1 included credit for
            your first billing cycle. With an active membership, you get 1 credit each month; extra imports use packs
            (1 / 5 / 10 / 20 credits). Membership is $1.99/mo after a free first month through Apple.
          </Text>

          <View style={styles.errorSlot}>
            {error ? <Text style={styles.banner}>{error}</Text> : null}
          </View>

          <PrimaryButton
            label="Create Account"
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit || submitting}
            style={styles.submit}
          />
        </View>

        <View style={styles.spacer} />

        <Pressable
          onPress={() => router.replace('/sign-in')}
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerEm}>Sign In</Text>
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
  hint: {
    ...textPresets.caption,
    color: semantic.textTertiary,
    marginTop: -spacing.xs,
  },
  creditsExplainer: {
    ...textPresets.caption,
    color: semantic.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
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
