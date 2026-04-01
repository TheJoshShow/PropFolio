/**
 * Settings / Account screen. Email, plan status, entitlement, renewal, remaining imports;
 * Manage Subscription, Restore Purchases, Billing Help, Update Password, Log Out, Legal.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useImportLimit } from '../../src/hooks/useImportLimit';
import { Card, Button, SubscriptionStatusCard, FreeImportsIndicator, SettingsGroupCard } from '../../src/components';
import { useThemeColors } from '../../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights } from '../../src/theme';
import { responsiveContentContainer } from '../../src/utils/responsive';
import {
  openSubscriptionManagement,
  getManageSubscriptionFallbackMessage,
} from '../../src/utils/subscriptionManagement';
import { openUrlSafe, openLegalDocument } from '../../src/utils/openLink';
import { getBillingHelpUrl, getSupportUrl, getRuntimeConfigDiagnostics } from '../../src/config';
import { FREE_IMPORT_LIMIT } from '../../src/services/importLimits';
import { getRestoreOutcome } from '../../src/services/restorePurchases';
import { trackEvent } from '../../src/services/analytics';
import {
  logEntitlementState,
  logUsageCheck,
} from '../../src/services/diagnostics';
import { formatPhoneForDisplay } from '../../src/utils/phone';
import {
  sendCrashlyticsVerificationNonFatal,
  requestCrashlyticsNativeTestCrash,
  isCrashlyticsVerificationUiEnabled,
  isCrashlyticsNativeCrashTestUiEnabled,
} from '../../src/services/monitoring';

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{title}</Text>
  );
}

function SettingsRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { session, signOut, deleteAccount, isAuthConfigured } = useAuth();
  const {
    subscriptionStatus,
    hasProAccess,
    restore,
    refresh: subscriptionRefresh,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    clearError,
  } = useSubscription();
  const { count, freeRemaining, isLoading: limitLoading, refresh: importLimitRefresh } = useImportLimit();

  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [manageTried, setManageTried] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const runtimeDiag = getRuntimeConfigDiagnostics();

  useFocusEffect(
    useCallback(() => {
      subscriptionRefresh();
      importLimitRefresh();
    }, [subscriptionRefresh, importLimitRefresh])
  );

  const handleRetrySubscription = useCallback(() => {
    clearError();
    subscriptionRefresh();
    importLimitRefresh();
  }, [clearError, subscriptionRefresh, importLimitRefresh]);

  const handleDebugRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([subscriptionRefresh(), importLimitRefresh()]);
    } finally {
      setRefreshing(false);
    }
  }, [subscriptionRefresh, importLimitRefresh]);

  const handleManageSubscription = useCallback(async () => {
    trackEvent('manage_subscription_tapped', { metadata: {} });
    setManageTried(true);
    const opened = await openSubscriptionManagement();
    if (!opened) {
      Alert.alert('Manage subscription', getManageSubscriptionFallbackMessage(), [
        { text: 'OK' },
      ]);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    clearError();
    setRestoring(true);
    try {
      const result = await restore();
      const outcome = getRestoreOutcome(result);
      Alert.alert(outcome.title, outcome.message, [{ text: 'OK' }]);
    } catch (e) {
      Alert.alert(
        'Restore failed',
        e instanceof Error ? e.message : 'Something went wrong. Try again or contact support.'
      );
    } finally {
      setRestoring(false);
    }
  }, [restore, clearError]);

  const handleOpenSupportUrl = useCallback(() => {
    void openUrlSafe(getSupportUrl(), { logContext: 'Settings:support' });
  }, []);

  const handleOpenBillingHelpUrl = useCallback(
    (url: string) => {
      void openUrlSafe(url, { logContext: 'Settings:billingHelp' });
    },
    []
  );

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'Permanently delete your account and data? You will be signed out and cannot undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              Alert.alert('Account deleted', 'Your account has been permanently deleted.');
            } catch (e) {
              Alert.alert(
                'Could not delete account',
                e instanceof Error ? e.message : 'Something went wrong. Try again or contact support.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [deleteAccount]);

  const isLoading = subscriptionLoading || limitLoading;
  const billingHelpUrl = getBillingHelpUrl();
  const showReleaseDiagnostics = __DEV__ || runtimeDiag.qaDiagnosticsEnabled;
  const releaseBlockers: string[] = [];
  if (!runtimeDiag.servicesConfigured.supabase) {
    releaseBlockers.push('Supabase URL or anon key is missing.');
  }
  if (!runtimeDiag.subscriptionConfigValid && runtimeDiag.platform === 'ios') {
    releaseBlockers.push('RevenueCat iOS key is missing.');
  }
  if (!runtimeDiag.authRedirectConfigValid) {
    releaseBlockers.push('Auth redirect scheme is invalid.');
  }
  if (runtimeDiag.networkSafety.supabaseUsesLocalhost || runtimeDiag.networkSafety.supabaseUsesLanIp) {
    releaseBlockers.push('Supabase URL points to localhost/LAN instead of hosted production.');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, responsiveContentContainer]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={[styles.headerButtonText, { color: colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={[styles.headerButtonText, { color: colors.primary }]}>Done</Text>
        </Pressable>
      </View>

      {/* Profile */}
      <View style={styles.profileBlock}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.avatarInitials, { color: colors.text }]}>
            {session?.email?.[0]?.toUpperCase() ?? 'P'}
          </Text>
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {session?.email?.split('@')[0] ?? 'PropFolio user'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {session?.email ?? '—'}
          </Text>
        </View>
      </View>

      {/* Account group */}
      <SettingsGroupCard
        title="Account"
        rows={[
          { label: 'Personal Information', onPress: () => {}, accessibilityLabel: 'Personal information' },
          {
            label: 'Security',
            onPress: () => router.push('/update-password'),
            accessibilityLabel: 'Security settings',
          },
          { label: 'Notification Settings', onPress: () => {}, accessibilityLabel: 'Notification settings' },
        ]}
        style={styles.groupCard}
      />

      <SectionHeader title="Plan & subscription" colors={colors} />
      <FreeImportsIndicator
        freeRemaining={freeRemaining}
        limit={FREE_IMPORT_LIMIT}
        isPro={hasProAccess}
        isLoading={limitLoading}
        variant="compact"
      />
      <SubscriptionStatusCard
        status={subscriptionStatus}
        importCount={count}
        freeRemaining={freeRemaining}
        freeLimit={FREE_IMPORT_LIMIT}
        isLoading={isLoading}
        error={subscriptionError}
        onRetry={handleRetrySubscription}
      />

      <SectionHeader title="Subscription" colors={colors} />
      <Card style={styles.card}>
        <Button
          title="Manage subscription"
          onPress={handleManageSubscription}
          variant="outline"
          fullWidth
          style={styles.button}
          disabled={isLoading}
          accessibilityLabel="Manage subscription"
        />
        {Platform.OS === 'ios' && (
          <Text style={[styles.iosSubscriptionHint, { color: colors.textMuted }]}>
            On iPhone: Settings → [Your Name] → Subscriptions
          </Text>
        )}
        <Button
          title={restoring ? 'Restoring…' : 'Restore purchases'}
          onPress={handleRestore}
          variant="outline"
          fullWidth
          style={styles.button}
          disabled={restoring}
          accessibilityLabel={restoring ? 'Restoring purchases' : 'Restore purchases'}
        />
      </Card>

      {/* Support group */}
      <SettingsGroupCard
        title="Support"
        rows={[
          {
            label: 'Help Center',
            onPress: () => handleOpenBillingHelpUrl(billingHelpUrl || getBillingHelpUrl()),
            accessibilityLabel: 'Help Center',
          },
          {
            label: 'Contact Support',
            onPress: handleOpenSupportUrl,
            accessibilityLabel: 'Contact support',
          },
          {
            label: 'Privacy Policy',
            onPress: () => void openLegalDocument('privacy'),
            accessibilityLabel: 'Privacy Policy',
          },
        ]}
        style={styles.groupCard}
      />

      {/* Logout footer */}
      <View style={styles.logoutFooter}>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutRow, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={[styles.signOutText, { color: colors.error }]}>Log Out</Text>
        </Pressable>
      </View>

      <SectionHeader title="Legal" colors={colors} />
      <Card style={styles.card}>
        <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
          PropFolio is for informational use only and does not provide investment, tax, or legal advice. Verify all numbers before making decisions.
        </Text>
        <Pressable
          onPress={() => void openLegalDocument('privacy')}
          style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>Privacy Policy</Text>
        </Pressable>
        <Pressable
          onPress={() => void openLegalDocument('terms')}
          style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Terms of Service"
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>Terms of Service</Text>
        </Pressable>
      </Card>

      {showReleaseDiagnostics && (
        <>
          <SectionHeader title="Release readiness diagnostics" colors={colors} />
          <Card style={styles.card}>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              env={runtimeDiag.environment} platform={runtimeDiag.platform}
            </Text>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              services: supabase={String(runtimeDiag.servicesConfigured.supabase)} subscriptions={String(runtimeDiag.servicesConfigured.subscriptions)} legalUrls={String(runtimeDiag.servicesConfigured.legalUrls)}
            </Text>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              apiBase: supabaseUrl={String(runtimeDiag.apiBaseUrlsPresent.supabaseUrl)}
            </Text>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              authRedirectValid={String(runtimeDiag.authRedirectConfigValid)} subscriptionConfigValid={String(runtimeDiag.subscriptionConfigValid)}
            </Text>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              supabaseHost={runtimeDiag.networkSafety.supabaseHost || 'missing'} localhost={String(runtimeDiag.networkSafety.supabaseUsesLocalhost)} lanIp={String(runtimeDiag.networkSafety.supabaseUsesLanIp)}
            </Text>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              qaDiagnosticsEnabled={String(runtimeDiag.qaDiagnosticsEnabled)}
            </Text>
          </Card>
          {releaseBlockers.length > 0 ? (
            <Card style={styles.card}>
              <Text style={[styles.blockerTitle, { color: colors.error }]}>Release blockers</Text>
              {releaseBlockers.map((b) => (
                <Text key={b} style={[styles.debugHint, { color: colors.textSecondary }]}>
                  - {b}
                </Text>
              ))}
            </Card>
          ) : (
            <Card style={styles.card}>
              <Text style={[styles.debugHint, { color: colors.success }]}>
                No config-level release blockers detected on this build.
              </Text>
            </Card>
          )}
          <Card style={styles.card}>
            <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
              Full manual checklist: expo-app/docs/release/FINAL_RELEASE_READINESS_CHECKLIST.md
            </Text>
          </Card>
          {isCrashlyticsVerificationUiEnabled() && (
            <>
              <SectionHeader title="Stability checks" colors={colors} />
              <Card style={styles.card}>
                <Text style={[styles.debugHint, { color: colors.textSecondary }]}>
                  Internal use only. Sends a test signal so you can confirm reporting is working.
                </Text>
                <Button
                  title="Send test signal"
                  variant="secondary"
                  fullWidth
                  style={styles.button}
                  onPress={() => {
                    void (async () => {
                      await sendCrashlyticsVerificationNonFatal();
                      Alert.alert(
                        'Test signal sent',
                        'If uploads are enabled for this build, it should appear in your crash reports within a few minutes.',
                        [{ text: 'OK' }]
                      );
                    })();
                  }}
                />
                {isCrashlyticsNativeCrashTestUiEnabled() && (
                  <>
                    <Text
                      style={[
                        styles.debugHint,
                        { color: colors.textSecondary, marginTop: spacing.m },
                      ]}
                    >
                      Debug build only: immediately closes the app. Disconnect the debugger to see a report.
                    </Text>
                    <Button
                      title="Close app (test)"
                      variant="outline"
                      fullWidth
                      style={styles.button}
                      onPress={() => {
                        Alert.alert(
                          'Close app?',
                          'This will immediately stop the app to test crash reporting. Use only when debugging.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Close app',
                              style: 'destructive',
                              onPress: () => requestCrashlyticsNativeTestCrash(),
                            },
                          ]
                        );
                      }}
                    />
                  </>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    minWidth: 60,
    alignItems: 'flex-start',
  },
  headerButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.title,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.m,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  profileEmail: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xxs,
  },
  groupCard: {
    marginBottom: spacing.m,
  },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
    marginTop: spacing.l,
  },
  card: { marginBottom: spacing.m },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.s,
  },
  rowLabel: { fontSize: fontSizes.sm },
  rowValue: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, flex: 1, textAlign: 'right' },
  debugHint: {
    fontSize: fontSizes.xs,
    marginBottom: spacing.s,
    lineHeight: lineHeights.xs,
  },
  blockerTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.s,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.s,
  },
  toggleLabel: { fontSize: fontSizes.sm },
  button: { marginBottom: spacing.s },
  iosSubscriptionHint: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xxs,
    marginBottom: spacing.s,
    lineHeight: lineHeights.xs,
  },
  hint: { fontSize: fontSizes.xs, marginTop: spacing.xs },
  signOutRow: { paddingVertical: spacing.s },
  signOutText: { fontSize: fontSizes.base, fontWeight: fontWeights.medium },
  logoutFooter: {
    marginTop: spacing.xl,
  },
  linkRow: { paddingVertical: spacing.s },
  linkText: { fontSize: fontSizes.base, fontWeight: fontWeights.medium },
  helpText: { fontSize: fontSizes.sm, lineHeight: lineHeights.base },
  disclaimer: { fontSize: fontSizes.xs, lineHeight: lineHeights.xs, marginBottom: spacing.s },
});
