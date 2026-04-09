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
  validateOptionalPhone,
  visibleAuthFieldError,
} from '@/features/auth';
import { BILLING_COPY } from '@/features/billing';
import { signUpWithEmail } from '@/services/auth';
import { tryGetSupabaseClient } from '@/services/supabase';
import { colors, iconSizes, layout, radius, semantic, spacing, textPresets } from '@/theme';

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isConfigured } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameBlurred, setNameBlurred] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const nameErr = useMemo(() => validateFullName(name), [name]);
  const emailErr = useMemo(() => validateEmail(email), [email]);
  const phoneErr = useMemo(() => validateOptionalPhone(phone), [phone]);
  const passErr = useMemo(() => validateNewPassword(password), [password]);
  const nameVisible = visibleAuthFieldError(nameErr, nameBlurred, submitAttempted);
  const emailVisible = visibleAuthFieldError(emailErr, emailBlurred, submitAttempted);
  const phoneVisible = visibleAuthFieldError(phoneErr, phoneBlurred, submitAttempted);
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
    const nErr = validateFullName(name);
    const eErr = validateEmail(email);
    const phErr = validateOptionalPhone(phone);
    const pErr = validateNewPassword(password);
    if (!isFormValid([nErr, eErr, phErr, pErr])) {
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
      const result = await signUpWithEmail(
        client,
        email.trim(),
        password,
        name.trim(),
        phone.trim() || undefined,
      );
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
            onBlur={() => setNameBlurred(true)}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            errorMessage={nameVisible}
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
            onBlur={() => setEmailBlurred(true)}
            autoComplete="email"
            textContentType="emailAddress"
            errorMessage={emailVisible}
            leftAccessory={
              <Ionicons name="mail-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />
          <AppTextField
            label="Phone (optional)"
            variant="outline"
            placeholder="Mobile number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            onBlur={() => setPhoneBlurred(true)}
            autoComplete="tel"
            textContentType="telephoneNumber"
            errorMessage={phoneVisible}
            leftAccessory={
              <Ionicons name="call-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />
          <AppTextField
            label="Password"
            variant="outline"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setPasswordBlurred(true)}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="password-new"
            errorMessage={passVisible}
            leftAccessory={
              <Ionicons name="lock-closed-outline" size={iconSizes.md} color={semantic.textTertiary} />
            }
          />
          <Text style={styles.hint}>
            At least 8 characters, including 1 uppercase letter, 1 number, and 1 symbol.
          </Text>

          <View style={styles.benefitsBlock}>
            <Text style={styles.benefitsSectionTitle}>{BILLING_COPY.createAccountMembershipIncludesTitle}</Text>
            <View style={styles.benefitList}>
              {BILLING_COPY.createAccountMembershipBullets.map((line) => (
                <View key={line} style={styles.benefitRow}>
                  <Text style={styles.benefitBullet}>•</Text>
                  <Text style={styles.benefitLine}>{line}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.benefitsSectionTitle}>{BILLING_COPY.createAccountLimitedOfferTitle}</Text>
            <View style={styles.benefitList}>
              {BILLING_COPY.createAccountLimitedOfferBullets.map((line) => (
                <View key={line} style={styles.benefitRow}>
                  <Text style={styles.benefitBullet}>•</Text>
                  <Text style={styles.benefitLine}>{line}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.errorSlot}>
            {error ? <Text style={styles.banner}>{error}</Text> : null}
          </View>

          <PrimaryButton
            label="Create Account"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting || !isConfigured}
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
  benefitsBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  /** Product-style subheads — not uppercase legal labels. */
  benefitsSectionTitle: {
    ...textPresets.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  benefitList: {
    gap: spacing.xs,
    paddingLeft: spacing.xxs,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  benefitBullet: {
    ...textPresets.bodySecondary,
    color: semantic.textSecondary,
    lineHeight: 22,
    width: 18,
    textAlign: 'center',
    marginTop: 1,
  },
  benefitLine: {
    ...textPresets.bodySecondary,
    flex: 1,
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
