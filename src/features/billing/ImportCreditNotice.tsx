import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, Card } from '@/components/ui';
import { useSubscription } from '@/features/subscription';
import { colors, spacing, typography } from '@/theme';

import { BILLING_COPY } from './billingCopy';

/**
 * Import flow: zero-credit recovery (top-up paths). Live balance lives on the import screen (`Credits left: X`).
 */
const WALLET_SYNC_UI_MAX_MS = 12_000;

export function ImportCreditNotice() {
  const sub = useSubscription();
  const [syncStall, setSyncStall] = useState(false);

  useEffect(() => {
    if (!sub.creditWalletSyncing) {
      setSyncStall(false);
      return;
    }
    const id = setTimeout(() => setSyncStall(true), WALLET_SYNC_UI_MAX_MS);
    return () => clearTimeout(id);
  }, [sub.creditWalletSyncing]);

  if (!sub.hasAppAccess) {
    return (
      <Text style={styles.needMembership} testID="propfolio.import.credits.needMembership">
        Active membership is required to import. Credits in your wallet stay on your account until you subscribe
        again—they never unlock the app by themselves.
      </Text>
    );
  }

  if (sub.creditBalance >= 1) {
    return null;
  }

  if (sub.creditWalletSyncing && !syncStall) {
    return (
      <Text style={styles.loading} testID="propfolio.import.credits.loading">
        Updating credit balance…
      </Text>
    );
  }

  return (
    <Card elevation="sm" style={styles.emptyCard} testID="propfolio.import.credits.empty">
      <Text style={styles.emptyTitle}>{BILLING_COPY.importNoCreditsTitle}</Text>
      <Text style={styles.emptyBody}>{BILLING_COPY.importNoCreditsBody}</Text>
      <View style={styles.emptyActions}>
        <AppButton label={BILLING_COPY.buyCreditsCta} onPress={sub.openCreditTopUp} />
        <AppButton label={BILLING_COPY.viewPlansCta} variant="ghost" onPress={sub.openPaywall} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  emptyActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  needMembership: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});
