import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { LEGAL_PRIVACY_POLICY_URL, LEGAL_TERMS_OF_SERVICE_URL } from '@/config';
import {
  BILLING_COPY,
  CreditWalletSummaryCard,
  logPaywallBillingDeveloperDiagnostics,
  PaywallBillingStatusPanel,
  resolvePaywallBillingState,
} from '@/features/billing';
import { useSubscription } from '@/features/subscription';
import { openLegalDocument } from '@/lib/openLegalDocument';
import { getRevenueCatEnvironmentBlockState } from '@/services/revenuecat';
import { STORE_PRODUCT_IDS } from '@/services/revenuecat/productIds';
import type { PaywallCatalog, PaywallPackageOption } from '@/services/revenuecat/types';
import { colors, hitSlop, layout, spacing, typography } from '@/theme';

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
          <Text style={styles.packDesc} numberOfLines={isMonthly ? 3 : 4}>
            {isMonthly ? BILLING_COPY.subscriptionTagline : pkg.description || 'Membership'}
          </Text>
          {isMonthly ? (
            <Text style={styles.packIncludes}>{BILLING_COPY.paywallSubscriptionIncludesMonthlyImport}</Text>
          ) : null}
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sub = useSubscription();
  const [catalog, setCatalog] = useState<PaywallCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
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
          'paywall_catalog_loaded',
        );
      }
    } finally {
      setCatalogLoading(false);
    }
  }, [sub]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
    }, [loadCatalog]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerLargeTitle: false,
      headerShadowVisible: false,
      headerStyle: stackModalHeaderBarStyle,
      headerTitleStyle: stackHeaderTitleStyle,
      headerLeft: () => <HeaderActionSpacer />,
      headerRight: () => <AppCloseButton onPress={() => router.back()} testID="propfolio.paywall.close" />,
      headerLeftContainerStyle: headerLeadingInset(insets.left),
      headerRightContainerStyle: headerTrailingInset(insets.right),
    });
  }, [navigation, router, insets.left, insets.right]);

  const billingResolution = useMemo(
    () =>
      resolvePaywallBillingState({
        envBlock: getRevenueCatEnvironmentBlockState(),
        catalog,
        catalogLoading,
        isPremium: sub.hasAppAccess,
      }),
    [catalog, catalogLoading, sub.hasAppAccess],
  );

  const onSubscribe = useCallback(async () => {
    await sub.purchaseSubscription();
  }, [sub]);

  const busy = sub.isPurchasing || sub.isRestoring;
  const showManage =
    sub.isPremium && sub.customerInfo.managementURL && typeof sub.customerInfo.managementURL === 'string';

  const creditTopUpDisabled =
    busy || !sub.canPurchaseCreditPacks || !billingResolution.storeCatalogReachable;

  return (
    <Screen
      scroll={false}
      safeAreaEdges={['top', 'bottom', 'left', 'right']}
      contentContainerStyle={styles.flex}
      testID="propfolio.paywall"
    >
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={catalogLoading} onRefresh={() => void loadCatalog()} />
        }
      >
        <View style={styles.mark}>
          <Ionicons name="layers-outline" size={36} color={colors.accentScore} />
        </View>
        <Text style={styles.title}>{BILLING_COPY.paywallTitle}</Text>
        <Text style={styles.subtitle}>{BILLING_COPY.paywallSubtitle}</Text>

        <PaywallBillingStatusPanel resolution={billingResolution} />

        <CreditWalletSummaryCard compact paywallEmbed />

        <Card elevation="xs" style={styles.planCard}>
          <Text style={styles.planCardTitleCaps}>{BILLING_COPY.paywallHowBillingWorksTitle}</Text>
          <Text style={styles.planLine}>{BILLING_COPY.paywallHowBillingWorksMembershipLine}</Text>
          <Text style={styles.planLineCredits}>{BILLING_COPY.paywallHowBillingWorksCreditsLine}</Text>
        </Card>

        {sub.storeNotice ? (
          <Card elevation="xs" style={styles.notice}>
            <Text style={styles.noticeText}>{sub.storeNotice}</Text>
            <AppButton label="Dismiss" variant="ghost" onPress={sub.clearStoreNotice} />
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
          <Text style={styles.sectionLabel}>{BILLING_COPY.startMembershipCta}</Text>
        )}

        {!sub.isPremium && catalogLoading && !catalog ? (
          <ActivityIndicator color={colors.accentCta} style={styles.spinner} />
        ) : null}

        {!sub.isPremium &&
          catalog?.subscriptionPackages.map((pkg) => (
            <SubscriptionRow
              key={pkg.refKey}
              pkg={pkg}
              disabled={busy || !billingResolution.canPurchaseSubscription}
              loading={sub.isPurchasing}
              onPress={() => void onSubscribe()}
              highlight={pkg.storeProductId === STORE_PRODUCT_IDS.subscriptionMonthly}
            />
          ))}

        {!sub.isPremium && billingResolution.purchaseActionHint ? (
          <Text style={styles.actionHint}>{billingResolution.purchaseActionHint}</Text>
        ) : null}

        <View style={styles.importCreditsBlock}>
          <Text style={styles.importCreditsTitle}>{BILLING_COPY.creditsHeadline}</Text>
          <Text style={styles.importCreditsBody}>{BILLING_COPY.importCreditsPaywallBody}</Text>
          <Text style={styles.importCreditsBody}>{BILLING_COPY.importCreditsPaywallBodySecond}</Text>
          <AppButton
            label={BILLING_COPY.paywallBuyCreditPacksCta}
            variant="secondary"
            onPress={sub.openCreditTopUp}
            disabled={creditTopUpDisabled}
            testID="propfolio.paywall.topupCta"
          />
        </View>

        <View style={styles.footerStack}>
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
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.md,
    paddingBottom: layout.listContentBottom,
    gap: spacing.md,
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
  planCardTitleCaps: {
    ...typography.sectionHeader,
    color: colors.textPrimary,
    letterSpacing: 0.6,
  },
  planLine: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  planLineCredits: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: spacing.xs,
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
  actionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
  restoreHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    ...typography.sectionHeader,
    color: colors.textPrimary,
  },
  importCreditsBlock: {
    gap: spacing.sm,
  },
  importCreditsTitle: {
    ...typography.sectionHeader,
    color: colors.textPrimary,
    letterSpacing: 0.6,
  },
  importCreditsBody: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  footerStack: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  spinner: { marginVertical: spacing.md },
  packCard: {
    padding: spacing.lg,
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
    ...typography.bodySecondary,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  packIncludes: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: spacing.xxs,
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
});




