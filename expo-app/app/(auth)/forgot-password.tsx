/**
 * Forgot Password screen. Request a password reset email; supports loading, error, success, and retry.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, SupabaseAuthEnvDevPanel, TextInput } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { getAuthErrorMessage, isValidEmail } from '../../src/utils/authErrors';
import {
  getAccountServicesUnavailableBannerMessage,
  getSupabaseAuthEnvPublicDiagnostics,
} from '../../src/config';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading: authLoading, isAuthConfigured } = useAuth();
  const colors = useThemeColors();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const trimmedEmail = email.trim().toLowerCase();
  const emailValid = trimmedEmail.length > 0 && isValidEmail(trimmedEmail);
  const isSubmitting = loading || authLoading;
  const canSubmit = isAuthConfigured && emailValid && !isSubmitting;
  const authConfigBanner = !isAuthConfigured ? getAccountServicesUnavailableBannerMessage() : null;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!isAuthConfigured) {
      setError(
        getAccountServicesUnavailableBannerMessage() ?? 'Password reset is not available. Please try again later.'
      );
      return;
    }
    if (!trimmedEmail) {
      setError('Enter your email address');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(trimmedEmail);
      if (result.sent) setSent(true);
      else setError('Password reset is not available. Please try again later.');
    } catch (e) {
      setError(getAuthErrorMessage(e, 'resetPassword'));
    } finally {
      setLoading(false);
    }
  }, [trimmedEmail, resetPassword, isAuthConfigured]);

  const handleRetry = useCallback(() => {
    setError(null);
    setSent(false);
  }, []);

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[styles.successScroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
          <Text style={[styles.successBody, { color: colors.textSecondary }]}>
            If an account exists for {trimmedEmail}, we sent a link to reset your password. Click the link in the email to set a new password, then sign in.
          </Text>
          <Button
            title="Back to Sign in"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            fullWidth
            style={styles.successButton}
          />
          <Pressable
            onPress={handleRetry}
            style={styles.retryTouchable}
            accessibilityRole="button"
            accessibilityLabel="Send to a different email"
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Send to a different email</Text>
          </Pressable>
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
          <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the email for your account. We’ll send a link to choose a new password.
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
            maxLength={255}
            accessibilityLabel="Email"
            editable={!isSubmitting}
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
                onPress={handleRetry}
                style={styles.retryTouchable}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Sending…</Text>
            </View>
          ) : (
            <Button
              title="Send reset link"
              onPress={handleSubmit}
              disabled={!canSubmit}
              fullWidth
              variant="primary"
              pill
              glow
              style={styles.submitButton}
            />
          )}

          <View style={styles.backRow}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backLinkTouchable}
              accessibilityRole="link"
              accessibilityLabel="Back to Sign in"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text style={[styles.backLink, { color: colors.primary }]}>Back to Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
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
  errorRow: {
    marginTop: spacing.xxs,
    marginBottom: spacing.m,
  },
  error: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  retryTouchable: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  retryText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  loadingText: {
    fontSize: fontSizes.base,
  },
  submitButton: { marginTop: spacing.m },
  successBody: {
    fontSize: fontSizes.base,
    marginBottom: spacing.xl,
    lineHeight: lineHeights.base,
    textAlign: 'center',
  },
  successButton: { marginBottom: spacing.l },
  backRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  backLinkTouchable: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  backLink: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
});
