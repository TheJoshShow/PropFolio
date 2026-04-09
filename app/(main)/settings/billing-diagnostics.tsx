import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { useBillingDiagnostics } from '@/features/billing/useBillingDiagnostics';
import { useSubscription } from '@/features/subscription';
import {
  buildPrimaryBillingDiagnosisString,
  logBillingDiagnosticsStructured,
} from '@/services/billing';
import { PROP_FOLIO_BILLING_DIAGNOSTICS_LOG_TAG } from '@/services/revenuecat/billingLogTags';
import { colors, spacing, typography } from '@/theme';

export default function BillingDiagnosticsScreen() {
  const sub = useSubscription();
  const diag = useBillingDiagnostics();
  const [refreshing, setRefreshing] = useState(false);

  const runRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await sub.refresh();
      await sub.loadPaywallCatalog();
      logBillingDiagnosticsStructured('billing_diagnostics_screen_refresh');
    } finally {
      setRefreshing(false);
    }
  }, [sub]);

  useFocusEffect(
    useCallback(() => {
      void runRefresh();
    }, [runRefresh]),
  );

  if (!__DEV__) {
    return (
      <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
        <Text style={styles.muted}>Billing diagnostics are available only in development builds.</Text>
      </Screen>
    );
  }

  const primary = buildPrimaryBillingDiagnosisString(diag);
  const json = JSON.stringify(diag, null, 2);

  return (
    <Screen scroll={false} safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void runRefresh()} />}
      >
        <Card elevation="sm" style={styles.primaryCard}>
          <Text style={styles.primaryLabel}>Primary diagnosis</Text>
          <Text style={styles.primaryText}>{primary}</Text>
        </Card>

        <AppButton
          label="Refresh & log JSON to Metro"
          onPress={() => void runRefresh()}
          loading={refreshing}
        />
        <AppButton
          label="Log structured snapshot now"
          variant="secondary"
          onPress={() => logBillingDiagnosticsStructured('billing_diagnostics_manual')}
        />

        <Text style={styles.hint}>
          Open Metro / Xcode console and search for{' '}
          <Text style={styles.mono}>{PROP_FOLIO_BILLING_DIAGNOSTICS_LOG_TAG}</Text>. Keys are summarized (appl_… len=n),
          never
          full secrets.
        </Text>

        <Text style={styles.section}>Full snapshot (selectable)</Text>
        <Card elevation="xs" style={styles.jsonCard}>
          <Text style={styles.json} selectable>
            {json}
          </Text>
        </Card>
      </ScrollView>
      {refreshing ? <ActivityIndicator style={styles.spinner} color={colors.accentCta} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  primaryCard: {
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.accentScore,
  },
  primaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  primaryText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  section: {
    ...typography.sectionHeader,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  jsonCard: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
  },
  json: {
    ...typography.captionSmall,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  muted: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  spinner: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
  },
});
