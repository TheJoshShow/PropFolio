/**
 * Login screen. Email/password, Google, Apple, and magic link.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, TextInput } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { getAuthErrorMessage, isValidEmail } from '../../src/utils/authErrors';

export default function LoginScreen() {
  const router = useRouter();
  const {
    session,
    signIn,
    signInWithOAuth,
    signInWithMagicLink,
    isLoading,
    lastAuthError,
    clearLastAuthError,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [magicLinkExpanded, setMagicLinkExpanded] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const colors = useThemeColors();

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

  const handleSignIn = async () => {
    setError(null);
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
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (e) {
      setError(getAuthErrorMessage(e, 'oauth'));
    }
  };

  const handleMagicLink = async () => {
    setMagicLinkError(null);
    const trimmed = magicLinkEmail.trim().toLowerCase();
    if (!trimmed) {
      setMagicLinkError('Enter your email');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setMagicLinkError('Enter a valid email address');
      return;
    }
    try {
      await signInWithMagicLink(trimmed);
      setMagicLinkSent(true);
    } catch (e) {
      setMagicLinkError(getAuthErrorMessage(e, 'magicLink'));
    }
  };

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
        <Pressable
          onPress={() => router.push('/(auth)')}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
        >
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Welcome</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to sync your portfolio
        </Text>
        <TextInput
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(null); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={255}
          accessibilityLabel="Email"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={(v) => { setPassword(v); setError(null); }}
          placeholder="••••••••"
          secureTextEntry
          accessibilityLabel="Password"
        />
        <Pressable
          onPress={() => { setError(null); router.push('/(auth)/forgot-password'); }}
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
              accessibilityLabel="Try again"
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        <Button
          title={isLoading ? 'Signing in…' : 'Sign in'}
          onPress={handleSignIn}
          disabled={isLoading || (!email.trim() || !password)}
          fullWidth
          variant="primary"
          pill
          glow
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>Or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Button
          title="Continue with Google"
          onPress={() => handleOAuth('google')}
          disabled={isLoading}
          variant="outline"
          fullWidth
          pill={false}
          style={styles.oauthButton}
        />
        <Button
          title="Continue with Apple"
          onPress={() => handleOAuth('apple')}
          disabled={isLoading}
          variant="outline"
          fullWidth
          pill={false}
          style={styles.oauthButton}
        />

        <View style={styles.magicLinkSection}>
          <Pressable
            onPress={() => {
              setMagicLinkExpanded((v) => !v);
              setMagicLinkError(null);
              setMagicLinkSent(false);
            }}
            style={styles.magicLinkTrigger}
            accessibilityRole="button"
            accessibilityLabel="Email me a sign-in link"
          >
            <Text style={[styles.magicLinkTriggerText, { color: colors.primary }]}>
              Email me a sign-in link
            </Text>
          </Pressable>
          {magicLinkExpanded && (
            <View style={styles.magicLinkForm}>
              {magicLinkSent ? (
                <Text style={[styles.magicLinkSuccess, { color: colors.textSecondary }]}>
                  Check your email for the sign-in link. Click the link to sign in.
                </Text>
              ) : (
                <>
                  <TextInput
                    label="Email"
                    value={magicLinkEmail}
                    onChangeText={(v) => {
                      setMagicLinkEmail(v);
                      setMagicLinkError(null);
                    }}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={255}
                    accessibilityLabel="Email for magic link"
                  />
                  {magicLinkError ? (
                    <Text style={[styles.magicLinkError, { color: colors.error }]}>{magicLinkError}</Text>
                  ) : null}
                  <Button
                    title="Send link"
                    onPress={handleMagicLink}
                    disabled={isLoading}
                    variant="secondary"
                    fullWidth
                  />
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.signUpRow}>
          <Text style={[styles.signUpPrompt, { color: colors.textSecondary }]}>
            Don&apos;t have an account?{' '}
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            accessibilityRole="link"
            accessibilityLabel="Sign up"
            style={styles.signUpLinkTouchable}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign up</Text>
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.m,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: fontSizes.sm,
    marginHorizontal: spacing.s,
  },
  oauthButton: { marginBottom: spacing.s },
  magicLinkSection: { marginTop: spacing.m },
  magicLinkTrigger: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  magicLinkTriggerText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  magicLinkForm: { marginTop: spacing.s },
  magicLinkSuccess: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.m,
    lineHeight: lineHeights.sm,
  },
  magicLinkError: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.s,
  },
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
    marginTop: spacing.xl,
    gap: spacing.xxs,
  },
  signUpPrompt: { fontSize: fontSizes.base },
  signUpLinkTouchable: { minHeight: 44, justifyContent: 'center', paddingVertical: spacing.xs },
  signUpLink: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold },
});
