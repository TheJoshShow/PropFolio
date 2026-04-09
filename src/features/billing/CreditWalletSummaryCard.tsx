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
  /** Avoid long SDK / billing-troubleshooting copy; paywall uses a single billing banner instead. */
  paywallEmbed?: boolean;
  /**
   * Settings → Membership: status from `hasAppAccess` only in this card; hide renewal, included-credit
   * lines, and bottom buy-credits CTAs (the parent screen owns pack purchase / gated copy).
   */
  membershipSettings?: boolean;
};

export function CreditWalletSummaryCard({ compact, paywallEmbed, membershipSettings }: Props) {
  const sub = useSubscription();
  const subRow = sub.creditWalletState?.subscription as Record<string, unknown> | undefined;
  const entitlementActive = Boolean(subRow?.entitlement_active);
  const renewalLine = membershipSettings
    ? null
    : renewalOrTrialLine(sub.creditWalletState?.subscription);
  const lifetimeUsed = sub.creditWalletState?.wallet?.lifetime_credits_used;

  let includedLine: string = BILLING_COPY.includedThisPeriod.notSubscribed;
  if (!membershipSettings && sub.hasAppAccess && entitlementActive) {
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

  const balancePending =
    sub.creditWalletSyncing || (sub.creditsLoading && sub.creditBalance === 0);

  /** `hasAppAccess` from `computeAppAccess` in `SubscriptionContext` (server mirror + RevenueCat when hydrated). */
  const membershipStatusLabel = (() => {
    if (!sub.accessHydrated || sub.accessDisplayState === 'loading') {
      return 'Checking…';
    }
    return sub.hasAppAccess ? 'Active' : 'Inactive';
  })();

  return (
    <Card elevation="sm" style={[styles.card, compact ? styles.cardCompact : null]}>
      <View style={styles.headerRow}>
        <Ionicons name="wallet-outline" size={22} color={colors.accentCta} />
        <Text style={styles.cardTitle}>{BILLING_COPY.walletTitle}</Text>
      </View>

      <Text style={styles.balanceLabel}>Available credits</Text>
      <Text style={styles.balanceValue} testID="propfolio.wallet.balance">
        {balancePending ? '…' : sub.creditBalance}
      </Text>

      <View style={styles.divider} />

      {membershipSettings ? (
        <>
          <Text style={styles.sectionLabel}>{BILLING_COPY.membershipStatusLabel}</Text>
          <Text style={styles.sectionValue}>{membershipStatusLabel}</Text>
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>{BILLING_COPY.subscriptionAccessTitle}</Text>
          <Text style={styles.sectionValue}>
            {paywallEmbed && !sub.hasAppAccess ? BILLING_COPY.paywallWalletMembershipStatus : sub.tierLabel}
          </Text>
          <Text style={styles.sectionSub}>
            {paywallEmbed && !sub.hasAppAccess ? BILLING_COPY.paywallWalletMembershipHint : sub.statusDetail}
          </Text>
          {renewalLine ? <Text style={styles.renewal}>{renewalLine}</Text> : null}
          <View style={styles.divider} />
          <Text style={styles.included}>{includedLine}</Text>
        </>
      )}

      {typeof lifetimeUsed === 'number' && lifetimeUsed > 0 ? (
        <Text style={styles.lifetime}>{BILLING_COPY.lifetimeUsed(lifetimeUsed)}</Text>
      ) : null}

      {!membershipSettings && !compact && sub.canPurchaseCreditPacks ? (
        <AppButton
          label={BILLING_COPY.buyCreditsCta}
          variant="secondary"
          onPress={sub.openCreditTopUp}
          style={styles.cta}
          testID="propfolio.wallet.topup"
        />
      ) : !membershipSettings && !compact && !sub.canPurchaseCreditPacks ? (
        <Text style={styles.gatedHint}>{BILLING_COPY.creditPacksRequireMembership}</Text>
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
  gatedHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
