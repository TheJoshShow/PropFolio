import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { CreditWalletSummaryCard } from '@/features/billing';
import { useSubscription } from '@/features/subscription';
import { colors, spacing, typography } from '@/theme';

export default function SubscriptionSettingsScreen() {
  const router = useRouter();
  const sub = useSubscription();
  const manageUrl = sub.customerInfo.managementURL;

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Card elevation="sm" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="diamond" size={28} color={colors.accentScore} />
        </View>
        <Text style={styles.heroTitle}>{sub.tierLabel}</Text>
        <Text style={styles.heroSub}>{sub.statusDetail}</Text>
        {sub.storeNotice ? (
          <Card elevation="xs" style={styles.inlineNotice}>
            <Text style={styles.noticeText}>{sub.storeNotice}</Text>
            <AppButton label="Dismiss" variant="ghost" onPress={sub.clearStoreNotice} />
          </Card>
        ) : null}
        {sub.lastError ? <Text style={styles.err}>{sub.lastError}</Text> : null}
      </Card>

      <CreditWalletSummaryCard />

      <Card elevation="xs" style={styles.limits}>
        <Text style={styles.limitsTitle}>How you pay</Text>
        <Text style={styles.limitsBody}>
          $1.99/month after a free first month (via Apple). 3 credits at signup: 2 signup bonus + 1 for your first
          billing cycle. Then 1 import credit each month with membership. Extra imports: 1 @ $1.99, 5 @ $8.99, 10 @
          $14.99, 20 @ $19.99—Apple shows the charge at purchase.
        </Text>
        <Text style={[styles.limitsBody, styles.limitsBodySecond]}>
          Membership unlocks the app; imports still cost credits. No membership means no access—even if credits remain.
        </Text>
      </Card>

      {sub.isPremium && manageUrl ? (
        <AppButton
          label="Manage membership in App Store"
          variant="secondary"
          onPress={() => void Linking.openURL(manageUrl)}
        />
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Buy credit packs" onPress={sub.openCreditTopUp} />
        <AppButton
          label="Membership & plans"
          variant="secondary"
          onPress={() => router.push('/paywall')}
          loading={sub.isLoading}
        />
        <AppButton
          label="Restore purchases"
          variant="secondary"
          onPress={() => void sub.restorePurchases()}
          loading={sub.isRestoring}
        />
        <AppButton label="Refresh status" variant="ghost" onPress={() => void sub.refresh()} />
      </View>

      <Text style={styles.foot}>
        Billing runs through Apple. Credits update after purchases sync to PropFolio.
      </Text>
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
  heroSub: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
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
  limits: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  limitsTitle: {
    ...typography.sectionHeader,
    color: colors.textPrimary,
  },
  limitsBody: {
    ...typography.bodySecondary,
    lineHeight: 22,
  },
  limitsBodySecond: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: spacing.sm,
  },
  foot: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
