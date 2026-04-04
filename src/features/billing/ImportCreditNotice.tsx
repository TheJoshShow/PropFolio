import { StyleSheet, Text, View } from 'react-native';

import { AppButton, Card } from '@/components/ui';
import { useSubscription } from '@/features/subscription';
import { colors, spacing, typography } from '@/theme';

import { BILLING_COPY } from './billingCopy';

/**
 * Import flow: confirms credit cost, remaining balance, or empty state with top-up paths.
 */
export function ImportCreditNotice() {
  const sub = useSubscription();

  if (sub.creditsLoading) {
    return (
      <Text style={styles.loading} testID="propfolio.import.credits.loading">
        Updating credit balance…
      </Text>
    );
  }

  if (sub.creditBalance < 1) {
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

  const remainingAfter = Math.max(0, sub.creditBalance - 1);

  return (
    <Text style={styles.confirmLine} testID="propfolio.import.credits.confirm">
      {BILLING_COPY.importUsesOne} {BILLING_COPY.importRemaining(sub.creditBalance, remainingAfter)}
    </Text>
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
  confirmLine: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});
