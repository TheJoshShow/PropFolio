/**
 * Paywall screen: shown when user hits free import limit or navigates from settings.
 * Uses PaywallContent (headline, benefits, plan cards, restore, footer) and usePaywallState.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components';
import {
  openSubscriptionManagement,
  getManageSubscriptionFallbackMessage,
} from '../src/utils/subscriptionManagement';
import { useThemeColors } from '../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights } from '../src/theme';
import { responsiveContentContainer } from '../src/utils/responsive';
import { trackEvent } from '../src/services/analytics';
import { PaywallContent } from '../src/features/paywall/PaywallContent';
import { PAYWALL_COPY } from '../src/features/paywall/paywallCopy';
import { usePaywallState } from '../src/hooks/usePaywallState';
import type { SubscriptionPlan } from '../src/services/offeringsMapper';

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const autoRefreshDoneRef = useRef(false);

  const state = usePaywallState({
    onPurchaseSuccess: () => {
      trackEvent('purchase_succeeded', { metadata: {} });
      router.back();
    },
    onPurchaseCancelled: () => {
      // Analytics: purchase_cancelled is sent from usePaywallState
    },
    entitlementDelayedMessage: PAYWALL_COPY.entitlementDelayedMessage,
  });

  useEffect(() => {
    trackEvent('paywall_viewed', {});
  }, []);

  // Auto-refresh once when offerings are unavailable (e.g. offline); avoid loop when refresh keeps returning fallback.
  useEffect(() => {
    if (
      autoRefreshDoneRef.current ||
      state.isLoading ||
      state.plansForDisplay.length > 0 ||
      state.offeringsResult.kind !== 'fallback'
    ) {
      return;
    }
    autoRefreshDoneRef.current = true;
    state.onRefresh();
  }, [state.isLoading, state.plansForDisplay.length, state.offeringsResult.kind, state.onRefresh]);

  const handlePurchase = (plan: SubscriptionPlan) => {
    trackEvent('paywall_plan_selected', { metadata: { planId: plan.id } });
    trackEvent('purchase_started', { metadata: { packageIdentifier: plan.id } });
    state.handlePurchase(plan);
  };

  if (state.hasProAccess) {
    const handleManageSubscription = async () => {
      const opened = await openSubscriptionManagement();
      if (!opened) {
        Alert.alert('Manage subscription', getManageSubscriptionFallbackMessage(), [
          { text: 'OK' },
        ]);
      }
    };

    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={[styles.centered, responsiveContentContainer]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {PAYWALL_COPY.alreadyProTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {PAYWALL_COPY.alreadyProSubtitle}
          </Text>
          <Button
            title="Manage subscription"
            onPress={handleManageSubscription}
            variant="outline"
            fullWidth
            style={styles.manageButton}
          />
          <Button title={PAYWALL_COPY.doneLabel} onPress={() => router.back()} fullWidth variant="secondary" pill={false} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <PaywallContent
        copy={PAYWALL_COPY}
        plans={state.plansForDisplay}
        offeringsResult={state.offeringsResult}
        isLoading={state.isLoading}
        error={state.error}
        purchasingId={state.purchasingId}
        restoring={state.restoring}
        pendingMessage={state.pendingMessage}
        entitlementVerifying={state.entitlementVerifying}
        entitlementDelayedMessage={state.entitlementDelayedMessage}
        restoreOutcome={state.restoreOutcome}
        clearRestoreOutcome={state.clearRestoreOutcome}
        onRefresh={state.onRefresh}
        onPurchase={handlePurchase}
        onRestore={state.handleRestore}
        onDismiss={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.base,
    marginBottom: spacing.xl,
    lineHeight: lineHeights.lg,
    textAlign: 'center',
  },
  manageButton: {
    marginBottom: spacing.m,
  },
});
