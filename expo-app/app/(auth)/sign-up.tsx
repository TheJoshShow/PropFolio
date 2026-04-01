/**
 * Create account — email, password, and name; email confirmation when required by Supabase.
 *
 * Manual QA (iPhone / production build):
 * - Valid signup with confirm email ON → "Check your inbox", no generic failure.
 * - Valid signup with confirm email OFF → lands in tabs.
 * - Empty submit → inline field errors, button stays disabled when form incomplete.
 * - Duplicate email → specific message, form values preserved.
 * - Airplane mode → network message.
 * - Missing EXPO_PUBLIC_SUPABASE_* in build → configuration banner, submit blocked.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, SupabaseAuthEnvDevPanel, TextInput } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { getAuthErrorMessage } from '../../src/utils/authErrors';
import { validateSignUpForm } from '../../src/utils/signupValidation';
import {
  getAccountServicesUnavailableBannerMessage,
  getSupabaseAuthEnvPublicDiagnostics,
  validateAuthEnv,
} from '../../src/config';
import { openLegalDocument } from '../../src/utils/openLink';
import { trackEvent } from '../../src/services/analytics';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { ModalCard } from '../../src/components/ModalCard';

const SCROLL_BOTTOM_PADDING = spacing.xxxl * 2 + 48;

export default function SignUpScreen() {
  const router = useRouter();
  const { session, signUp, isLoading, isAuthConfigured } = useAuth();
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const submitGuardRef = useRef(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const [successState, setSuccessState] = useState<'none' | 'email_confirm'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authConfigBanner = !isAuthConfigured ? getAccountServicesUnavailableBannerMessage() : null;

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return;
    if (isAuthConfigured) return;
    const r = validateAuthEnv();
    console.warn('[PropFolio][signup] auth unavailable', {
      missing: r.missing,
      invalidReasons: r.invalidReasons,
      isValid: r.isValid,
    });
  }, [isAuthConfigured]);

  const clearError = useCallback(() => setError(null), []);

  const formValues = { firstName, lastName, email, password, confirmPassword };
  const { errors: fieldErrors } = validateSignUpForm(formValues, showRequiredErrors);

  const handleSubmit = useCallback(async () => {
    if (submitGuardRef.current || isLoading) return;
    if (!isAuthConfigured) {
      setError(
        getAccountServicesUnavailableBannerMessage() ?? 'Account creation isn’t available in this build.'
      );
      return;
    }

    setShowRequiredErrors(true);
    const strict = validateSignUpForm(
      { firstName, lastName, email, password, confirmPassword },
      true
    );
    if (!strict.ok) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    submitGuardRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      trackEvent('signup_started', { metadata: {} });
      const result = await signUp({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (result.needsEmailConfirmation) {
        setSuccessState('email_confirm');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      setError(getAuthErrorMessage(e, 'signUp'));
    } finally {
      submitGuardRef.current = false;
      setIsSubmitting(false);
    }
  }, [firstName, lastName, email, password, confirmPassword, signUp, isLoading, isAuthConfigured, router]);

  if (successState === 'email_confirm') {
    return (
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={[styles.successScroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrapper}>
            <ModalCard>
              <Text style={[styles.title, { color: colors.text }]}>Check your inbox</Text>
              <Text style={[styles.successBody, { color: colors.textSecondary }]}>
                We sent a link to {email.trim().toLowerCase()}. Open it to confirm your email, then come back and sign in.
              </Text>
              <Button
                title="Back to sign in"
                onPress={() => router.replace('/(auth)/login')}
                variant="primary"
                fullWidth
                pill
              />
            </ModalCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const busy = isLoading || isSubmitting;
  /** Allow press while form is incomplete so we can show inline required errors after tap. */
  const canPressSubmit = isAuthConfigured && !busy;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrapper}>
            <ModalCard>
              <View style={styles.headerRow}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                <Pressable
                  onPress={() => router.push('/(auth)')}
                  style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close and return to welcome"
                >
                  <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                </Pressable>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Add your name, email, and a secure password.
              </Text>

              {authConfigBanner ? (
                <>
                  <View
                    style={[styles.configBanner, { borderColor: colors.error, backgroundColor: colors.surface }]}
                    accessibilityRole="alert"
                  >
                    <Text style={[styles.configBannerText, { color: colors.error }]}>{authConfigBanner}</Text>
                  </View>
                  {typeof __DEV__ !== 'undefined' && __DEV__ ? (
                    <SupabaseAuthEnvDevPanel
                      diagnostics={getSupabaseAuthEnvPublicDiagnostics()}
                      textColor={colors.text}
                      mutedColor={colors.textSecondary}
                      borderColor={colors.textSecondary}
                      surfaceColor={colors.surface}
                    />
                  ) : null}
                </>
              ) : null}

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
            error={fieldErrors.firstName}
          />
              <TextInput
            label="Last name"
            value={lastName}
            onChangeText={(v) => {
              setLastName(v);
              clearError();
            }}
            placeholder="Last name"
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Last name"
            maxLength={100}
            error={fieldErrors.lastName}
          />
              <TextInput
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              clearError();
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Email"
            maxLength={255}
            error={fieldErrors.email}
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
            error={fieldErrors.password}
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
            onChangeText={(v) => {
              setConfirmPassword(v);
              clearError();
            }}
            placeholder="Re-enter password"
            secureTextEntry={!showPassword}
            accessibilityLabel="Confirm password"
            error={fieldErrors.confirmPassword}
            blurOnSubmit
            onSubmitEditing={canPressSubmit ? handleSubmit : undefined}
            returnKeyType="go"
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
                    accessibilityLabel="Dismiss error"
                  >
                    <Text style={[styles.retryText, { color: colors.primary }]}>Dismiss</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={[styles.agreement, { color: colors.textSecondary }]}>
                By continuing you agree to our{' '}
                <Text
                  style={[styles.agreementLink, { color: colors.primary }]}
                  onPress={() => void openLegalDocument('terms')}
                  accessibilityRole="link"
                  accessibilityLabel="Terms of Service"
                >
                  Terms
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
                title={busy ? 'Creating account…' : 'Create account'}
                onPress={handleSubmit}
                accessibilityLabel={busy ? 'Creating account' : 'Create account'}
                disabled={!canPressSubmit}
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
            </ModalCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  headerSpacer: {
    width: 32,
  },
  closeButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    minWidth: 32,
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  keyboardView: { flex: 1 },
  configBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  configBannerText: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
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
  subtitle: {
    fontSize: fontSizes.base,
    marginBottom: spacing.xl,
    lineHeight: lineHeights.base,
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
