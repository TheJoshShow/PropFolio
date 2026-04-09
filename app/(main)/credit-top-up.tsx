import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppCloseButton,
  HeaderActionSpacer,
  headerLeadingInset,
  headerTrailingInset,
  stackHeaderTitleStyle,
  stackModalHeaderBarStyle,
} from '@/components/navigation';
import { AppButton, Card, Screen } from '@/components/ui';
import {
  BILLING_COPY,
  creditPackPurchasesAllowed,
  logPaywallBillingDeveloperDiagnostics,
  PaywallBillingStatusPanel,
  resolvePaywallBillingState,
} from '@/features/billing';
import { useSubscription } from '@/features/subscription';
import { getRevenueCatEnvironmentBlockState } from '@/services/revenuecat';
import {
  CREDIT_PACK_PRODUCT_ORDER,
  CREDITS_PER_STORE_PRODUCT,
  inferCreditPackSizeFromProductId,
} from '@/services/revenuecat/productIds';
import type { PaywallCatalog, PaywallPackageOption } from '@/services/revenuecat/types';
import { colors, layout, spacing, typography } from '@/theme';

type PackRow = {
  productId: string;
  credits: number;
  referencePrice: string;
  pkg: PaywallPackageOption | undefined;
};

function buildPackRows(catalog: PaywallCatalog | null): PackRow[] {
  const pkgs = catalog?.creditPackages ?? [];
  const byId = new Map<string, PaywallPackageOption>();
  const byCredits = new Map<number, PaywallPackageOption>();
  for (const p of pkgs) {
    byId.set(p.storeProductId, p);
    const cq = p.creditsQuantity ?? inferCreditPackSizeFromProductId(p.storeProductId);
    if (cq != null && !byCredits.has(cq)) {
      byCredits.set(cq, p);
    }
  }
  return CREDIT_PACK_PRODUCT_ORDER.map((productId, index) => {
    const credits = CREDITS_PER_STORE_PRODUCT[productId] ?? 0;
    const pkg = byId.get(productId) ?? (credits > 0 ? byCredits.get(credits) : undefined);
    return {
      productId,
      credits,
      referencePrice: BILLING_COPY.packReference[index]?.referencePrice ?? '',
      pkg,
    };
  });
}

export default function CreditTopUpScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sub = useSubscription();
  const [catalog, setCatalog] = useState<PaywallCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await sub.loadPaywallCatalog();
      setCatalog(c);
      if (__DEV__) {
        logPaywallBillingDeveloperDiagnostics(
          resolvePaywallBillingState({
            envBlock: getRevenueCatEnvironmentBlockState(),
            catalog: c,
            catalogLoading: false,
            isPremium: sub.hasAppAccess,
          }),
          'credit_top_up_catalog_loaded',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [sub]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerLargeTitle: false,
      headerShadowVisible: false,
      headerStyle: stackModalHeaderBarStyle,
      headerTitleStyle: stackHeaderTitleStyle,
      headerLeft: () => <HeaderActionSpacer />,
      headerRight: () => <AppCloseButton onPress={() => router.back()} testID="propfolio.creditTopUp.close" />,
      headerLeftContainerStyle: headerLeadingInset(insets.left),
      headerRightContainerStyle: headerTrailingInset(insets.right),
    });
  }, [navigation, router, insets.left, insets.right]);

  const rows = useMemo(() => buildPackRows(catalog), [catalog]);
  const busy = sub.isPurchasing || sub.isRestoring;

  const billingResolution = useMemo(
    () =>
      resolvePaywallBillingState({
        envBlock: getRevenueCatEnvironmentBlockState(),
        catalog,
        catalogLoading: loading,
        isPremium: sub.hasAppAccess,
      }),
    [catalog, loading, sub.hasAppAccess],
  );

  const creditPurchasesAllowed = useMemo(
    () =>
      sub.canPurchaseCreditPacks &&
      creditPackPurchasesAllowed({
        envBlock: getRevenueCatEnvironmentBlockState(),
        catalog,
        catalogLoading: loading,
        isPremium: sub.hasAppAccess,
      }),
    [sub.canPurchaseCreditPacks, catalog, loading, sub.hasAppAccess],
  );

  const onBuy = useCallback(
    async (refKey: string | undefined) => {
      if (!refKey) {
        return;
      }
      setPurchasingKey(refKey);
      try {
        await sub.purchaseCreditsPack(refKey);
      } finally {
        setPurchasingKey(null);
      }
    },
    [sub],
  );

  return (
    <Screen
      scroll={false}
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.flex}
      testID="propfolio.creditTopUp"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.accentCta} />
        }
      >
        <View style={styles.mark}>
          <Ionicons name="add-circle-outline" size={34} color={colors.accentScore} />
        </View>
        <Text style={styles.title}>{BILLING_COPY.creditTopUpTitle}</Text>

        {!sub.canPurchaseCreditPacks ? (
          <Card elevation="xs" style={styles.membershipGate}>
            <Text style={styles.membershipGateText}>{BILLING_COPY.creditPacksRequireMembership}</Text>
            <AppButton label="View membership" variant="secondary" onPress={() => router.push('/paywall')} />
          </Card>
        ) : null}

        {sub.canPurchaseCreditPacks ? <PaywallBillingStatusPanel resolution={billingResolution} /> : null}

        <Card elevation="xs" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{BILLING_COPY.creditBalanceLabel}</Text>
          <Text style={styles.balanceValue}>
            {sub.creditWalletSyncing || (sub.creditsLoading && sub.creditBalance === 0)
              ? '…'
              : BILLING_COPY.creditBalanceAvailable(sub.creditBalance)}
          </Text>
        </Card>

        {loading && !catalog ? <ActivityIndicator color={colors.accentCta} style={styles.spinner} /> : null}

        <Text style={styles.sectionLabel}>{BILLING_COPY.creditChoosePackSection}</Text>

        {rows.map((row) => {
          const pkg = row.pkg;
          const priceLine = pkg?.priceString ?? row.referencePrice;
          const disabled = busy || !pkg || !creditPurchasesAllowed;
          return (
            <Card key={row.productId} elevation="sm" style={styles.packCard}>
              <View style={styles.packRow}>
                <View style={styles.packLeft}>
                  <Text style={styles.packCredits}>
                    {row.credits} {row.credits === 1 ? 'credit' : 'credits'}
                  </Text>
                  <Text style={styles.packMeta}>
                    {pkg?.title ? `${pkg.title} · ` : null}
                    {priceLine}
                  </Text>
                  {!pkg ? <Text style={styles.packMissing}>{BILLING_COPY.creditPackUnavailableFromStore}</Text> : null}
                </View>
                <AppButton
                  label={purchasingKey === pkg?.refKey ? '…' : 'Buy'}
                  variant="secondary"
                  disabled={disabled}
                  loading={purchasingKey === pkg?.refKey}
                  onPress={() => void onBuy(pkg?.refKey)}
                />
              </View>
            </Card>
          );
        })}

        <AppButton
          label={sub.isRestoring ? 'Restoring…' : BILLING_COPY.restore}
          variant="ghost"
          onPress={() => void sub.restorePurchases()}
          disabled={busy || !billingResolution.canUseRestorePurchases}
          loading={sub.isRestoring}
        />
        {billingResolution.restoreDisabledExplanation && !billingResolution.canUseRestorePurchases ? (
          <Text style={styles.restoreHint}>{billingResolution.restoreDisabledExplanation}</Text>
        ) : null}

        {sub.lastError ? <Text style={styles.err}>{sub.lastError}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.md,
    paddingBottom: layout.listContentBottom,
    gap: spacing.md,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentScoreMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  balanceCard: {
    padding: spacing.md,
    gap: spacing.xs,
    borderColor: colors.accentCta,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    ...typography.bodyMedium,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  restoreHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  membershipGate: {
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.accentCta,
  },
  membershipGateText: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  spinner: { marginVertical: spacing.lg },
  sectionLabel: {
    ...typography.sectionHeader,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  packCard: {
    padding: spacing.md,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  packLeft: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  packCredits: {
    ...typography.bodyMedium,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  packMissing: {
    ...typography.captionSmall,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  err: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
});
