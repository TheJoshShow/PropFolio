/**
 * Sign in — email and password. Forgot password when Supabase is configured.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, SupabaseAuthEnvDevPanel, TextInput } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { getAuthErrorMessage, isValidEmail } from '../../src/utils/authErrors';
import { getAccountServicesUnavailableBannerMessage, getSupabaseAuthEnvPublicDiagnostics } from '../../src/config';

const SCROLL_BOTTOM_PADDING = spacing.xxxl * 2 + 24;

export default function LoginScreen() {
  const router = useRouter();
  const { session, signIn, isLoading, lastAuthError, clearLastAuthError, isAuthConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = useThemeColors();

  const emailTrimmed = email.trim().toLowerCase();
  const emailInlineError =
    email.length > 0 && !isValidEmail(emailTrimmed) ? 'Enter a valid email address' : undefined;

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (lastAuthError) {
      setError(lastAuthError);
      clearLastAuthError();
    }
  }, [lastAuthError, clearLastAuthError]);

  const authConfigBanner = !isAuthConfigured ? getAccountServicesUnavailableBannerMessage() : null;

  const handleSignIn = useCallback(async () => {
    if (isLoading) return;
    setError(null);
    if (!isAuthConfigured) {
      setError(
        getAccountServicesUnavailableBannerMessage() ?? 'Sign-in isn’t available in this build.'
      );
      return;
    }
    if (!email.trim()) {
      setError('Enter your email');
      return;
    }
    const emailNorm = email.trim().toLowerCase();
    if (!isValidEmail(emailNorm)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }
    try {
      await signIn(emailNorm, password);
    } catch (e) {
      setError(getAuthErrorMessage(e, 'signIn'));
    }
  }, [email, password, isLoading, signIn, isAuthConfigured]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Pressable
            onPress={() => router.push('/(auth)')}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Back to welcome"
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>← Welcome</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in with the email and password for your account.
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
              setError(null);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={255}
            textContentType="username"
            autoComplete="email"
            accessibilityLabel="Email"
            error={emailInlineError}
            returnKeyType="next"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
            accessibilityLabel="Password"
            returnKeyType="go"
            onSubmitEditing={() => {
              if (!isLoading && emailTrimmed && password && isValidEmail(emailTrimmed)) {
                void handleSignIn();
              }
            }}
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
          <Pressable
            onPress={() => {
              setError(null);
              router.push('/(auth)/forgot-password');
            }}
            style={styles.forgotRow}
            accessibilityRole="link"
            accessibilityLabel="Forgot password?"
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
          </Pressable>
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
                onPress={() => setError(null)}
                style={styles.retryTouchable}
                accessibilityRole="button"
                accessibilityLabel="Dismiss error"
              >
                <Text style={[styles.retryText, { color: colors.primary }]}>Dismiss</Text>
              </Pressable>
            </View>
          ) : null}
          <Button
            title={isLoading ? 'Signing in…' : 'Sign in'}
            onPress={handleSignIn}
            disabled={
              !isAuthConfigured ||
              isLoading ||
              !email.trim() ||
              !password ||
              Boolean(emailInlineError)
            }
            fullWidth
            variant="primary"
            pill
            glow
            style={styles.primaryCta}
          />

          <View style={styles.signUpRow}>
            <Text style={[styles.signUpPrompt, { color: colors.textSecondary }]}>New here? </Text>
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              accessibilityRole="link"
              accessibilityLabel="Create account"
              style={styles.signUpLinkTouchable}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text style={[styles.signUpLink, { color: colors.primary }]}>Create an account</Text>
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
    paddingBottom: SCROLL_BOTTOM_PADDING,
    justifyContent: 'center',
    minHeight: 400,
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
  showPasswordRow: {
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  showPasswordLabel: { fontSize: fontSizes.sm },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.m,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
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
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  retryText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  primaryCta: { marginTop: spacing.xxs },
  backRow: {
    marginBottom: spacing.m,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xxl,
    gap: spacing.xxs,
  },
  signUpPrompt: { fontSize: fontSizes.base },
  signUpLinkTouchable: { minHeight: 44, justifyContent: 'center', paddingVertical: spacing.xs },
  signUpLink: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold },
});
