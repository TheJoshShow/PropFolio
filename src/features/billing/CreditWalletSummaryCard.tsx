import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, Card } from '@/components/ui';
import { useSubscription } from '@/features/subscription';
import { colors, spacing, typography } from '@/theme';

import { BILLING_COPY } from './billingCopy';
import { renewalOrTrialLine } from './billingFormat';

type Props = {
  /** Tighter spacing for embedding in paywall. */
  compact?: boolean;
};

export function CreditWalletSummaryCard({ compact }: Props) {
  const sub = useSubscription();
  const subRow = sub.creditWalletState?.subscription as Record<string, unknown> | undefined;
  const entitlementActive = Boolean(subRow?.entitlement_active);
  const renewalLine = renewalOrTrialLine(sub.creditWalletState?.subscription);
  const lifetimeUsed = sub.creditWalletState?.wallet?.lifetime_credits_used;

  let includedLine: string = BILLING_COPY.includedThisPeriod.notSubscribed;
  if (sub.hasAppAccess && entitlementActive) {
    switch (sub.monthlyIncludedGrantStatus) {
      case 'granted':
        includedLine = BILLING_COPY.includedThisPeriod.granted;
        break;
      case 'pending':
        includedLine = BILLING_COPY.includedThisPeriod.pending;
        break;
      default:
        includedLine = BILLING_COPY.includedThisPeriod.unknown;
    }
  }

  return (
    <Card elevation="sm" style={[styles.card, compact ? styles.cardCompact : null]}>
      <View style={styles.headerRow}>
        <Ionicons name="wallet-outline" size={22} color={colors.accentCta} />
        <Text style={styles.cardTitle}>{BILLING_COPY.walletTitle}</Text>
      </View>

      <Text style={styles.balanceLabel}>Available credits</Text>
      <Text style={styles.balanceValue} testID="propfolio.wallet.balance">
        {sub.creditsLoading ? '…' : sub.creditBalance}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>{BILLING_COPY.subscriptionAccessTitle}</Text>
      <Text style={styles.sectionValue}>{sub.tierLabel}</Text>
      <Text style={styles.sectionSub}>{sub.statusDetail}</Text>
      {renewalLine ? <Text style={styles.renewal}>{renewalLine}</Text> : null}

      <View style={styles.divider} />

      <Text style={styles.included}>{includedLine}</Text>

      {typeof lifetimeUsed === 'number' && lifetimeUsed > 0 ? (
        <Text style={styles.lifetime}>{BILLING_COPY.lifetimeUsed(lifetimeUsed)}</Text>
      ) : null}

      {!compact ? (
        <AppButton
          label={BILLING_COPY.buyCreditsCta}
          variant="secondary"
          onPress={sub.openCreditTopUp}
          style={styles.cta}
          testID="propfolio.wallet.topup"
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.xs,
    borderColor: colors.accentCta,
  },
  cardCompact: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.sectionHeader,
    color: colors.textPrimary,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xxs,
  },
  renewal: {
    ...typography.bodySecondary,
    color: colors.accentScore,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  included: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  lifetime: {
    ...typography.captionSmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
  },
});
