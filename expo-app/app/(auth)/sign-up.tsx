/**
 * Sign-up screen. Create account with email/password; supports email confirmation flow.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, TextInput } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import {
  getAuthErrorMessage,
  isValidEmail,
  isPasswordLongEnough,
  getPasswordRequirementMessage,
} from '../../src/utils/authErrors';
import { openLegalDocument } from '../../src/utils/openLink';
import { trackEvent } from '../../src/services/analytics';
import { getOptionalPhoneFieldError, normalizePhoneNumber } from '../../src/utils/phone';

/** Extra bottom padding so submit button stays visible above keyboard on small screens. */
const SCROLL_BOTTOM_PADDING = 140;

function SignUpFormWrapper({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={style}>{children}</View>;
}

export default function SignUpScreen() {
  const router = useRouter();
  const { session, signUp, isLoading } = useAuth();
  const colors = useThemeColors();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const [successState, setSuccessState] = useState<'none' | 'email_confirm' | 'signed_in'>('none');

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, router]);

  const clearError = useCallback(() => setError(null), []);

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const trimmedPhone = phone.trim();
  const phoneFieldError = getOptionalPhoneFieldError(phone);
  const trimmedEmail = email.trim().toLowerCase();
  const emailValid = trimmedEmail.length > 0 && isValidEmail(trimmedEmail);
  const passwordValid = password.length >= 8;
  const confirmMatch = password === confirmPassword && confirmPassword.length > 0;
  const formValid =
    trimmedFirst.length > 0 &&
    trimmedLast.length > 0 &&
    phoneFieldError === null &&
    emailValid &&
    passwordValid &&
    confirmMatch;

  const handleSubmit = useCallback(async () => {
    setError(null);
    setShowRequiredErrors(true);
    if (!formValid) return;

    const emailVal = trimmedEmail || email.trim().toLowerCase();
    if (!isValidEmail(emailVal)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isPasswordLongEnough(password)) {
      setError(getPasswordRequirementMessage());
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      trackEvent('signup_started', { metadata: {} });
      const optionalErr = getOptionalPhoneFieldError(phone);
      if (optionalErr) {
        setError(optionalErr);
        return;
      }
      const normalized =
        trimmedPhone.length > 0 ? normalizePhoneNumber(phone) : null;
      const result = await signUp({
        email: emailVal,
        password,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        ...(normalized ? { phoneNumber: normalized } : {}),
      });
      if (result.needsEmailConfirmation) {
        setSuccessState('email_confirm');
      } else {
        setSuccessState('signed_in');
      }
    } catch (e) {
      setError(getAuthErrorMessage(e, 'signUp'));
    }
  }, [
    formValid,
    trimmedFirst,
    trimmedLast,
    trimmedPhone,
    trimmedEmail,
    email,
    phone,
    password,
    confirmPassword,
    signUp,
  ]);

  if (successState === 'email_confirm') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[styles.successScroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
          <Text style={[styles.successBody, { color: colors.textSecondary }]}>
            We sent a confirmation link to {email.trim().toLowerCase()}. Click the link to activate your account, then sign in.
          </Text>
          <Button
            title="Back to Sign in"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <SignUpFormWrapper style={styles.formWrapper}>
        <Pressable
          onPress={() => router.push('/(auth)')}
          style={styles.backToWelcomeRow}
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
        >
          <Text style={[styles.backToWelcomeText, { color: colors.textSecondary }]}>← Welcome</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start using PropFolio with your own account
        </Text>

        <TextInput
          label="First name"
          value={firstName}
          onChangeText={(v) => {
            setFirstName(v);
            clearError();
          }}
          placeholder="First name"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="First name"
          maxLength={100}
          error={trimmedFirst.length === 0 && firstName.length > 0 ? 'Required' : undefined}
        />
        <TextInput
          label="Last name"
          value={lastName}
          onChangeText={(v) => { setLastName(v); clearError(); }}
          placeholder="Last name"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Last name"
          maxLength={100}
          error={trimmedLast.length === 0 && lastName.length > 0 ? 'Required' : undefined}
        />
        <TextInput
          label="Phone number (optional)"
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            clearError();
          }}
          placeholder="e.g. (312) 555-1212"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoCorrect={false}
          accessibilityLabel="Phone number optional"
          maxLength={20}
          error={
            showRequiredErrors
              ? phoneFieldError ?? undefined
              : trimmedPhone.length > 0
                ? phoneFieldError ?? undefined
                : undefined
          }
        />
        <Text style={[styles.optionalHint, { color: colors.textSecondary }]}>
          Add a mobile number for account recovery and updates. Leave blank if you prefer.
        </Text>
        <TextInput
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); clearError(); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email"
          maxLength={255}
          error={
            email.length > 0 && !isValidEmail(email.trim())
              ? 'Enter a valid email address'
              : undefined
          }
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            clearError();
          }}
          placeholder="At least 8 characters"
          secureTextEntry={!showPassword}
          accessibilityLabel="Password"
          error={
            password.length > 0 && !isPasswordLongEnough(password)
              ? getPasswordRequirementMessage()
              : undefined
          }
        />
        <Pressable
          onPress={() => setShowPassword((p) => !p)}
          style={styles.showPasswordRow}
          accessibilityRole="checkbox"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityState={{ checked: showPassword }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.showPasswordLabel, { color: colors.textSecondary }]}>
            {showPassword ? 'Hide password' : 'Show password'}
          </Text>
        </Pressable>
        <TextInput
          label="Confirm password"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); clearError(); }}
          placeholder="Confirm password"
          secureTextEntry={!showPassword}
          accessibilityLabel="Confirm password"
          error={
            confirmPassword.length > 0 && password !== confirmPassword
              ? 'Passwords do not match'
              : undefined
          }
          blurOnSubmit
          onSubmitEditing={formValid && !isLoading ? handleSubmit : undefined}
        />

        {error ? (
          <View style={styles.errorRow}>
            <Text
              style={[styles.error, { color: colors.error }]}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
            <Pressable
              onPress={clearError}
              style={styles.retryTouchable}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.agreement, { color: colors.textSecondary }]}>
          By creating an account you agree to our{' '}
          <Text
            style={[styles.agreementLink, { color: colors.primary }]}
            onPress={() => void openLegalDocument('terms')}
            accessibilityRole="link"
            accessibilityLabel="Terms of Service"
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={[styles.agreementLink, { color: colors.primary }]}
            onPress={() => void openLegalDocument('privacy')}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
          >
            Privacy Policy
          </Text>
          .
        </Text>

        <Button
          title={isLoading ? 'Creating account…' : 'Create account'}
          onPress={handleSubmit}
          accessibilityLabel={isLoading ? 'Creating account' : 'Create account'}
          disabled={!formValid || isLoading}
          fullWidth
          variant="primary"
          pill
          glow
          style={styles.submitButton}
        />

        <View style={styles.backRow}>
          <Text style={[styles.backPrompt, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            style={styles.backLinkTouchable}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text style={[styles.backLink, { color: colors.primary }]}>Sign in</Text>
          </Pressable>
        </View>
        </SignUpFormWrapper>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  formWrapper: { width: '100%' },
  backToWelcomeRow: {
    marginBottom: spacing.m,
    minHeight: 44,
    justifyContent: 'center',
  },
  backToWelcomeText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: SCROLL_BOTTOM_PADDING,
    minHeight: 400,
  },
  successScroll: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    justifyContent: 'center',
    minHeight: 300,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.title,
    marginBottom: spacing.xs,
  },
  successTitle: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.s,
  },
  subtitle: {
    fontSize: fontSizes.base,
    marginBottom: spacing.xl,
    lineHeight: lineHeights.base,
  },
  optionalHint: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    marginTop: -spacing.s,
    marginBottom: spacing.m,
  },
  showPasswordRow: {
    marginBottom: spacing.m,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.s,
  },
  showPasswordLabel: { fontSize: fontSizes.sm },
  errorRow: {
    marginTop: spacing.xxs,
    marginBottom: spacing.m,
  },
  error: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  retryTouchable: {
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  retryText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  submitButton: { marginTop: spacing.xxs },
  successBody: {
    fontSize: fontSizes.base,
    marginBottom: spacing.xl,
    lineHeight: 22,
    textAlign: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    gap: spacing.xxs,
  },
  backPrompt: { fontSize: fontSizes.base },
  backLinkTouchable: { minHeight: 44, justifyContent: 'center', paddingVertical: spacing.xs },
  backLink: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold },
  agreement: { fontSize: fontSizes.xs, lineHeight: lineHeights.xs, marginBottom: spacing.m, textAlign: 'center' },
  agreementLink: { fontWeight: fontWeights.medium },
});
