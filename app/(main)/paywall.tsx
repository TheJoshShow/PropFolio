import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { LEGAL_PRIVACY_POLICY_URL, LEGAL_TERMS_OF_SERVICE_URL } from '@/config';
import { BILLING_COPY, CreditWalletSummaryCard } from '@/features/billing';
import { useSubscription } from '@/features/subscription';
import { openLegalDocument } from '@/lib/openLegalDocument';
import { STORE_PRODUCT_IDS } from '@/services/revenuecat/productIds';
import type { PaywallCatalog, PaywallPackageOption } from '@/services/revenuecat/types';
import { colors, hitSlop, layout, spacing, typography } from '@/theme';

const VALUE_BULLETS = [
  'Full confidence scoring & scenario modeling',
  BILLING_COPY.signupCredits,
  BILLING_COPY.cycleCredits,
  'Deterministic numbers — never “AI guess” metrics',
];

function SubscriptionRow({
  pkg,
  disabled,
  loading,
  onPress,
  highlight,
}: {
  pkg: PaywallPackageOption;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
  highlight?: boolean;
}) {
  const isMonthly = pkg.storeProductId === STORE_PRODUCT_IDS.subscriptionMonthly;
  return (
    <Card elevation="sm" style={[styles.packCard, highlight ? styles.packHighlight : null]}>
      <View style={styles.packRow}>
        <View style={styles.packText}>
          <Text style={styles.packTitle}>{isMonthly ? BILLING_COPY.subscriptionHeadline : pkg.title}</Text>
          <Text style={styles.packDesc} numberOfLines={4}>
            {isMonthly ? BILLING_COPY.subscriptionTagline : pkg.description || 'Membership'}
          </Text>
          {isMonthly ? <Text style={styles.packMicro}>{BILLING_COPY.subscriptionDetail}</Text> : null}
          {isMonthly ? <Text style={styles.priceHint}>{BILLING_COPY.priceAfterFreeMonthHint}</Text> : null}
        </View>
        <View style={styles.packRight}>
          <Text style={styles.packPrice}>{pkg.priceString}</Text>
          <AppButton
            label={loading ? '…' : 'Subscribe'}
            onPress={onPress}
            disabled={disabled || loading}
            loading={loading}
          />
        </View>
      </View>
    </Card>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const sub = useSubscription();
  const [catalog, setCatalog] = useState<PaywallCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const c = await sub.loadPaywallCatalog();
      setCatalog(c);
    } finally {
      setCatalogLoading(false);
    }
  }, [sub]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
    }, [loadCatalog]),
  );

  const onSubscribe = useCallback(async () => {
    await sub.purchaseSubscription();
  }, [sub]);

  const busy = sub.isPurchasing || sub.isRestoring;
  const showManage =
    sub.isPremium && sub.customerInfo.managementURL && typeof sub.customerInfo.managementURL === 'string';

  return (
    <Screen
      scroll={false}
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.flex}
      testID="propfolio.paywall"
    >
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={catalogLoading} onRefresh={() => void loadCatalog()} />
        }
      >
        <Pressable
          style={styles.close}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={hitSlop}
        >
          <Text style={styles.closeText}>Close</Text>
        </Pressable>

        <View style={styles.mark}>
          <Ionicons name="layers-outline" size={36} color={colors.accentScore} />
        </View>
        <Text style={styles.title}>{BILLING_COPY.paywallTitle}</Text>
        <Text style={styles.subtitle}>{BILLING_COPY.paywallSubtitle}</Text>

        <CreditWalletSummaryCard compact />

        <Card elevation="xs" style={styles.planCard}>
          <Text style={styles.planCardTitle}>How billing works</Text>
          <Text style={styles.planLine}>
            <Text style={styles.planEm}>Membership: </Text>
            {BILLING_COPY.subscriptionTagline}. {BILLING_COPY.subscriptionDetail}
          </Text>
          <Text style={styles.planLine}>
            <Text style={styles.planEm}>Credits: </Text>
            {BILLING_COPY.signupCredits} {BILLING_COPY.cycleCredits}
          </Text>
          <Text style={styles.planLineMuted}>{BILLING_COPY.topUpIntro}</Text>
          <Text style={styles.packGrid}>
            Extra credits: {BILLING_COPY.packLadderShort} — Apple charges the live price at purchase.
          </Text>
        </Card>

        {sub.storeNotice ? (
          <Card elevation="xs" style={styles.notice}>
            <Text style={styles.noticeText}>{sub.storeNotice}</Text>
            <AppButton label="Dismiss" variant="ghost" onPress={sub.clearStoreNotice} />
          </Card>
        ) : null}

        {catalog?.sdkMessage ? (
          <Card elevation="xs" style={styles.warnCard}>
            <Text style={styles.warnText}>{catalog.sdkMessage}</Text>
            <Text style={styles.warnHint}>
              Use an iOS development build (not Expo Go), set RevenueCat keys, and match offering identifiers in `.env`.
            </Text>
          </Card>
        ) : null}

        {sub.isPremium ? (
          <Card elevation="xs" style={styles.active}>
            <Text style={styles.activeTitle}>Membership active</Text>
            <Text style={styles.activeText}>{sub.statusDetail}</Text>
            {showManage ? (
              <AppButton
                label="Manage membership"
                variant="secondary"
                onPress={() => {
                  const url = sub.customerInfo.managementURL;
                  if (url) {
                    void Linking.openURL(url);
                  }
                }}
              />
            ) : null}
          </Card>
        ) : (
          <Text style={styles.sectionLabel}>Start membership</Text>
        )}

        {!sub.isPremium && catalogLoading && !catalog ? (
          <ActivityIndicator color={colors.accentCta} style={styles.spinner} />
        ) : null}

        {!sub.isPremium &&
          catalog?.subscriptionPackages.map((pkg) => (
            <SubscriptionRow
              key={pkg.refKey}
              pkg={pkg}
              disabled={busy}
              loading={sub.isPurchasing}
              onPress={() => void onSubscribe()}
              highlight={pkg.storeProductId === STORE_PRODUCT_IDS.subscriptionMonthly}
            />
          ))}

        {!sub.isPremium && !catalogLoading && catalog && catalog.subscriptionPackages.length === 0 ? (
          <Text style={styles.empty}>{BILLING_COPY.catalogSetupHint}</Text>
        ) : null}

        <Text style={styles.sectionLabel}>Import credits</Text>
        <Text style={styles.sectionSub}>{BILLING_COPY.importCreditsPaywallBody}</Text>

        <AppButton
          label="Buy credit packs"
          variant="secondary"
          onPress={sub.openCreditTopUp}
          disabled={busy}
          testID="propfolio.paywall.topupCta"
        />

        <Card elevation="sm" style={styles.bullets}>
          {VALUE_BULLETS.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </Card>

        <AppButton
          label={sub.isRestoring ? 'Restoring…' : BILLING_COPY.restore}
          variant="ghost"
          onPress={() => void sub.restorePurchases()}
          disabled={busy}
          loading={sub.isRestoring}
        />

        <Text style={styles.legalMicro}>{BILLING_COPY.legalNote}</Text>
        <View style={styles.legalRow}>
          <Pressable onPress={() => void openLegalDocument(LEGAL_PRIVACY_POLICY_URL)} hitSlop={hitSlop}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}> · </Text>
          <Pressable onPress={() => void openLegalDocument(LEGAL_TERMS_OF_SERVICE_URL)} hitSlop={hitSlop}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
        </View>

        {sub.lastError ? <Text style={styles.err}>{sub.lastError}</Text> : null}

        {sub.customerInfo.status === 'unknown' && !sub.lastError ? (
          <Text style={styles.micro}>
            App Store status unknown — pull to refresh or tap Restore purchases. Check network and billing setup.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    paddingBottom: layout.listContentBottom,
    gap: spacing.md,
  },
  close: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeText: {
    ...typography.bodyMedium,
    color: colors.accentCta,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentScoreMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  planCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderColor: colors.border,
  },
  planCardTitle: {
    ...typography.sectionHeader,
    color: colors.textPrimary,
  },
  planLine: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  planEm: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planLineMuted: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  packGrid: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notice: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.accentScoreMuted,
    borderColor: colors.accentScore,
  },
  noticeText: {
    ...typography.bodySecondary,
  },
  warnCard: {
    padding: spacing.md,
    gap: spacing.xs,
    borderColor: colors.warning,
  },
  warnText: {
    ...typography.bodyMedium,
    color: colors.warning,
  },
  warnHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionLabel: {
    ...typography.sectionHeader,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  spinner: { marginVertical: spacing.lg },
  packCard: {
    padding: spacing.md,
  },
  packHighlight: {
    borderColor: colors.accentCta,
    borderWidth: 2,
  },
  packRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  packText: { flex: 1, minWidth: 0, gap: spacing.xxs },
  packTitle: {
    ...typography.bodyMedium,
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  packDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  packMicro: {
    ...typography.captionSmall,
    color: colors.textMuted,
  },
  priceHint: {
    ...typography.caption,
    color: colors.accentScore,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  packRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    minWidth: 112,
  },
  packPrice: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  active: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.accentScoreMuted,
    borderColor: colors.accentScore,
  },
  activeTitle: {
    ...typography.sectionHeader,
    textAlign: 'center',
  },
  activeText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  bullets: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletText: {
    ...typography.body,
    flex: 1,
    lineHeight: 24,
  },
  legalMicro: {
    ...typography.captionSmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  legalLink: {
    ...typography.bodyMedium,
    color: colors.accentCta,
  },
  legalDot: {
    ...typography.caption,
    color: colors.textMuted,
  },
  err: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  micro: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
