import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { BILLING_COPY, CreditWalletSummaryCard } from '@/features/billing';
import { useSubscription } from '@/features/subscription';
import { colors, spacing, typography } from '@/theme';

export default function SubscriptionSettingsScreen() {
  const sub = useSubscription();
  const manageUrl = sub.customerInfo.managementURL;

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Card elevation="sm" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="diamond" size={28} color={colors.accentScore} />
        </View>
        <Text style={styles.heroTitle}>{sub.tierLabel}</Text>
        {sub.storeNotice ? (
          <Card elevation="xs" style={styles.inlineNotice}>
            <Text style={styles.noticeText}>{sub.storeNotice}</Text>
            <AppButton label="Dismiss" variant="ghost" onPress={sub.clearStoreNotice} />
          </Card>
        ) : null}
        {sub.lastError ? <Text style={styles.err}>{sub.lastError}</Text> : null}
      </Card>

      <CreditWalletSummaryCard membershipSettings />

      {sub.hasAppAccess && manageUrl ? (
        <AppButton
          label="Manage membership in App Store"
          variant="secondary"
          onPress={() => void Linking.openURL(manageUrl)}
        />
      ) : null}

      <View style={styles.actions}>
        <AppButton
          label={BILLING_COPY.paywallBuyCreditPacksCta}
          onPress={sub.openCreditTopUp}
          disabled={!sub.canPurchaseCreditPacks}
        />
        {!sub.canPurchaseCreditPacks ? (
          <Text style={styles.gatedCaption}>{BILLING_COPY.creditPacksRequireMembership}</Text>
        ) : null}
        <AppButton label="Refresh status" variant="ghost" onPress={() => void sub.refresh()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentScoreMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  inlineNotice: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.accentScoreMuted,
    borderColor: colors.accentScore,
  },
  noticeText: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  err: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  gatedCaption: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
