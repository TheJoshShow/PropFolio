import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { BILLING_COPY } from '@/features/billing';
import { useSubscription } from '@/features/subscription';
import {
  CREDIT_PACK_PRODUCT_ORDER,
  CREDITS_PER_STORE_PRODUCT,
} from '@/services/revenuecat/productIds';
import type { PaywallCatalog, PaywallPackageOption } from '@/services/revenuecat/types';
import { colors, hitSlop, layout, spacing, typography } from '@/theme';

type PackRow = {
  productId: string;
  credits: number;
  referencePrice: string;
  pkg: PaywallPackageOption | undefined;
};

function buildPackRows(catalog: PaywallCatalog | null): PackRow[] {
  const byId = new Map<string, PaywallPackageOption>();
  for (const p of catalog?.creditPackages ?? []) {
    byId.set(p.storeProductId, p);
  }
  return CREDIT_PACK_PRODUCT_ORDER.map((productId, index) => ({
    productId,
    credits: CREDITS_PER_STORE_PRODUCT[productId] ?? 0,
    referencePrice: BILLING_COPY.packReference[index]?.referencePrice ?? '',
    pkg: byId.get(productId),
  }));
}

export default function CreditTopUpScreen() {
  const router = useRouter();
  const sub = useSubscription();
  const [catalog, setCatalog] = useState<PaywallCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await sub.loadPaywallCatalog();
      setCatalog(c);
    } finally {
      setLoading(false);
    }
  }, [sub]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const rows = useMemo(() => buildPackRows(catalog), [catalog]);
  const busy = sub.isPurchasing || sub.isRestoring;

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
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.accentCta} />
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
          <Ionicons name="add-circle-outline" size={34} color={colors.accentScore} />
        </View>
        <Text style={styles.title}>Top up credits</Text>
        <Text style={styles.subtitle}>{BILLING_COPY.topUpIntro}</Text>

        <Card elevation="xs" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <Text style={styles.balanceValue}>
            {sub.creditsLoading ? '…' : `${sub.creditBalance} available`}
          </Text>
        </Card>

        {catalog?.sdkMessage ? (
          <Card elevation="xs" style={styles.warnCard}>
            <Text style={styles.warnText}>{catalog.sdkMessage}</Text>
          </Card>
        ) : null}

        {loading && !catalog ? <ActivityIndicator color={colors.accentCta} style={styles.spinner} /> : null}

        <Text style={styles.sectionLabel}>Choose a pack</Text>
        <Text style={styles.referenceNote}>
          Reference pricing (US): {BILLING_COPY.packReference.map((p) => `${p.credits} @ ${p.referencePrice}`).join(' · ')}
          . Apple may show tax or regional pricing at checkout.
        </Text>

        {rows.map((row) => {
          const pkg = row.pkg;
          const priceLine = pkg?.priceString ?? row.referencePrice;
          const disabled = busy || !pkg;
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
                  {!pkg ? (
                    <Text style={styles.packMissing}>This pack is not available in this build—check App Store Connect.</Text>
                  ) : null}
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
          disabled={busy}
          loading={sub.isRestoring}
        />

        {sub.lastError ? <Text style={styles.err}>{sub.lastError}</Text> : null}
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
  subtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
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
  warnCard: {
    padding: spacing.md,
    borderColor: colors.warning,
  },
  warnText: {
    ...typography.bodySecondary,
    color: colors.warning,
  },
  spinner: { marginVertical: spacing.lg },
  sectionLabel: {
    ...typography.sectionHeader,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  referenceNote: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
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
    color: colors.warning,
    marginTop: spacing.xxs,
  },
  err: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
});
