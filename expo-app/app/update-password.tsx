/**
 * Update password screen. Requires current session; updates via Supabase auth.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { Button, TextInput } from '../src/components';
import { spacing, fontSizes, fontWeights } from '../src/theme';
import { useThemeColors } from '../src/components/useThemeColors';
import { responsiveContentContainer } from '../src/utils/responsive';
import { dismissOrReplaceSettings } from '../src/utils/appNavigation';
import {
  getAuthErrorMessage,
  isPasswordLongEnough,
  getPasswordRequirementMessage,
} from '../src/utils/authErrors';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { session, isLoading, updatePassword, isAuthConfigured } = useAuth();
  const colors = useThemeColors();

  useEffect(() => {
    if (!isLoading && session === null) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, router]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValid = isPasswordLongEnough(password);
  const match = password.length > 0 && password === confirmPassword;
  const canSubmit = isAuthConfigured && passwordValid && match && !loading;

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!isAuthConfigured) {
      setError('Password update is not available.');
      return;
    }
    if (!passwordValid) {
      setError(getPasswordRequirementMessage());
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (e) {
      setError(getAuthErrorMessage(e, 'updatePassword'));
    } finally {
      setLoading(false);
    }
  }, [isAuthConfigured, password, confirmPassword, passwordValid, updatePassword]);

  if (session === null) {
    return null; // Redirect to login is in progress or auth not yet resolved
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.centered, responsiveContentContainer]}>
          <Text style={[styles.title, { color: colors.text }]}>Password updated</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your password has been changed. Use it the next time you sign in.
          </Text>
          <Button title="Back to Settings" onPress={() => dismissOrReplaceSettings(router)} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, responsiveContentContainer]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>Update password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter a new password. You will stay signed in.
          </Text>

          <TextInput
            label="New password"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(null); }}
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={password.length > 0 && !passwordValid ? getPasswordRequirementMessage() : undefined}
          />
          <TextInput
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
            placeholder="Confirm new password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : undefined}
          />

          {error ? (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          ) : null}

          <Button
            title={loading ? 'Updating…' : 'Update password'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            fullWidth
            style={styles.submit}
          />
          <Button title="Cancel" onPress={() => dismissOrReplaceSettings(router)} variant="ghost" fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  centered: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSizes.base, marginBottom: spacing.xl, lineHeight: 22 },
  error: { fontSize: fontSizes.sm, marginBottom: spacing.s },
  submit: { marginTop: spacing.s, marginBottom: spacing.m },
});
