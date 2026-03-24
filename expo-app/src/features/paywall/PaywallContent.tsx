/**
 * Reusable paywall content: headline, subheadline, benefits, plan cards, restore, footer.
 * Use in paywall screen or modal. Receives copy and state/handlers from parent.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { useThemeColors } from '../../components/useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../theme';
import { responsiveContentContainer } from '../../utils/responsive';
import { openLegalDocument } from '../../utils/openLink';
import type { SubscriptionPlan } from '../../services/offeringsMapper';
import type { OfferingsLoadResult } from '../../services/offeringsMapper';
import type { RestoreOutcome } from '../../services/restorePurchases';

export interface PaywallCopy {
  headline: string;
  subheadline: string;
  benefits: readonly string[];
  footer: string;
  restoreLabel: string;
  restoringLabel: string;
  doneLabel: string;
  subscribeLabel: string;
  tryAgainLabel: string;
  retryLabel: string;
  loadingPlansLabel: string;
  activatingLabel?: string;
  entitlementDelayedMessage?: string;
  closeLabel?: string;
}

export interface PaywallContentProps {
  copy: PaywallCopy;
  /** Mapped plans (recommended first). */
  plans: SubscriptionPlan[];
  /** Success with plans or fallback. */
  offeringsResult: OfferingsLoadResult;
  isLoading: boolean;
  error: string | null;
  purchasingId: string | null;
  restoring: boolean;
  pendingMessage: string | null;
  /** True while verifying entitlement after purchase (show activating state). */
  entitlementVerifying?: boolean;
  /** Message when entitlement is delayed (show message + Close). */
  entitlementDelayedMessage?: string | null;
  /** Outcome of last restore (show card and actions). */
  restoreOutcome?: RestoreOutcome | null;
  /** Clear restore outcome when user dismisses the card. */
  clearRestoreOutcome?: () => void;
  onRefresh: () => Promise<void>;
  onPurchase: (plan: SubscriptionPlan) => void;
  onRestore: () => void;
  onDismiss: () => void;
  diagnostics?: {
    initialized: boolean;
    platform: 'ios' | 'android' | 'web';
    billingConfigured: boolean;
    billingKeySource: string;
    offeringsLoaded: boolean;
    entitlementActive: boolean;
    lastError: string | null;
  };
}

export function PaywallContent({
  copy,
  plans,
  offeringsResult,
  isLoading,
  error,
  purchasingId,
  restoring,
  pendingMessage,
  entitlementVerifying = false,
  entitlementDelayedMessage = null,
  restoreOutcome = null,
  clearRestoreOutcome,
  onRefresh,
  onPurchase,
  onRestore,
  onDismiss,
  diagnostics,
}: PaywallContentProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const planButtonsDisabled = restoring || !!purchasingId || entitlementVerifying;

  useEffect(() => {
    if (!__DEV__) return;
    // DEV-only mapping visibility: helps confirm that UI "Monthly/Annual" corresponds
    // to the expected RevenueCat product identifiers from billing.ts.
    const mapping = plans.map((p) => ({
      uiPlanId: p.id,
      uiType: p.type,
      rcPackageIdentifier: p.displayPackage.identifier,
      rcProductIdentifier: p.displayPackage.product?.identifier,
    }));
    // Avoid logging if there are no plans to display.
    if (mapping.length > 0) console.log('[Paywall DEV] plan mapping:', mapping);
  }, [plans]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: styles.content.paddingBottom + insets.bottom },
        responsiveContentContainer,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading && !purchasingId && !restoring && !entitlementVerifying}
          onRefresh={onRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.headline, { color: colors.text }]}>{copy.headline}</Text>
      <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
        {copy.subheadline}
      </Text>

      <View style={styles.benefitsBlock}>
        {copy.benefits.map((benefit, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
            <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
          </View>
        ))}
      </View>

      {error ? (
        <Card style={[styles.messageCard, { backgroundColor: colors.errorMuted }]}>
          <Text style={[styles.messageText, { color: colors.error }]}>{error}</Text>
          <Button
            title={copy.tryAgainLabel}
            onPress={onRefresh}
            variant="secondary"
            fullWidth
            style={styles.messageButton}
          />
        </Card>
      ) : null}

      {pendingMessage ? (
        <Card style={[styles.messageCard, { backgroundColor: colors.warningMuted }]}>
          <Text style={[styles.messageText, { color: colors.warning }]}>{pendingMessage}</Text>
        </Card>
      ) : null}

      {entitlementVerifying ? (
        <Card style={[styles.messageCard, { backgroundColor: colors.primaryMuted }]}>
          <View style={styles.activatingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.messageText, { color: colors.text }]}>
              {copy.activatingLabel ?? 'Activating your subscription…'}
            </Text>
          </View>
        </Card>
      ) : null}

      {entitlementDelayedMessage ? (
        <Card style={[styles.messageCard, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.messageText, { color: colors.text }]}>{entitlementDelayedMessage}</Text>
          <Button
            title={copy.closeLabel ?? 'Close'}
            onPress={onDismiss}
            variant="secondary"
            fullWidth
            style={styles.messageButton}
          />
        </Card>
      ) : null}

      {restoreOutcome ? (
        <Card
          style={[
            styles.messageCard,
            restoreOutcome.status === 'success' && { backgroundColor: colors.successMuted },
            (restoreOutcome.status === 'no_purchases' || restoreOutcome.status === 'offline') && {
              backgroundColor: colors.warningMuted,
            },
            restoreOutcome.status === 'failed' && { backgroundColor: colors.errorMuted },
          ]}
        >
          <Text style={[styles.restoreOutcomeTitle, { color: colors.text }]}>
            {restoreOutcome.title}
          </Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            {restoreOutcome.message}
          </Text>
          {restoreOutcome.status === 'success' ? (
            <Button
              title={copy.doneLabel}
              onPress={() => {
                clearRestoreOutcome?.();
                onDismiss();
              }}
              fullWidth
              style={styles.messageButton}
            />
          ) : restoreOutcome.status === 'no_purchases' ? (
            <Button
              title={copy.doneLabel}
              onPress={() => clearRestoreOutcome?.()}
              variant="secondary"
              fullWidth
              style={styles.messageButton}
            />
          ) : (
            <Button
              title={copy.tryAgainLabel}
              onPress={() => {
                clearRestoreOutcome?.();
                onRefresh();
              }}
              variant="secondary"
              fullWidth
              style={styles.messageButton}
            />
          )}
        </Card>
      ) : null}

      {isLoading && plans.length === 0 && !error ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {copy.loadingPlansLabel}
          </Text>
        </View>
      ) : null}

      {offeringsResult.kind === 'fallback' && !isLoading ? (
        <Card style={styles.fallbackCard}>
          <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
            {offeringsResult.message}
          </Text>
          <Button
            title={offeringsResult.retryLabel}
            onPress={onRefresh}
            variant="secondary"
            fullWidth
            style={styles.fallbackButton}
          />
        </Card>
      ) : plans.length > 0 ? (
        <View style={styles.plansBlock}>
          {plans.map((plan) => {
            const isPurchasing = purchasingId === plan.id;
            const isBestValue = plan.isBestValue;
            return (
              <Card
                key={plan.id}
                style={[
                  styles.planCard,
                  isBestValue && {
                    borderColor: colors.primary,
                    borderWidth: 2,
                    backgroundColor: colors.primaryMuted,
                  },
                ]}
                padded
              >
                <View style={styles.planCardInner}>
                  <View style={styles.planInfo}>
                    <View style={styles.planTitleRow}>
                      <Text style={[styles.planLabel, { color: colors.text }]}>
                        Pro {plan.label}
                      </Text>
                      {isBestValue ? (
                        <View
                          style={[styles.bestValueBadge, { backgroundColor: colors.primary }]}
                        >
                          <Text style={[styles.bestValueText, { color: colors.onPrimary }]}>Best Value</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.planPrice, { color: colors.textSecondary }]}>
                      {plan.priceString}
                    </Text>
                  </View>
                  <Button
                    title={isPurchasing ? '…' : copy.subscribeLabel}
                    onPress={() => onPurchase(plan)}
                    disabled={planButtonsDisabled}
                    fullWidth={false}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      <Pressable
        onPress={onRestore}
        disabled={restoring}
        style={styles.restoreTouchable}
        accessibilityRole="button"
        accessibilityLabel={copy.restoreLabel}
      >
        <Text style={[styles.restoreText, { color: colors.primary }]}>
          {restoring ? copy.restoringLabel : copy.restoreLabel}
        </Text>
      </Pressable>

      <Text style={[styles.footerText, { color: colors.textMuted }]}>{copy.footer}</Text>

      <View style={styles.legalRow}>
        <Pressable
          onPress={() => void openLegalDocument('terms')}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Terms of Service"
        >
          <Text style={[styles.legalLink, { color: colors.primary }]}>Terms of Service</Text>
        </Pressable>
        <Text style={[styles.footerText, { color: colors.textMuted }]}> · </Text>
        <Pressable
          onPress={() => void openLegalDocument('privacy')}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
        >
          <Text style={[styles.legalLink, { color: colors.primary }]}>Privacy Policy</Text>
        </Pressable>
      </View>

      <Button
        title={copy.doneLabel}
        onPress={onDismiss}
        variant="ghost"
        fullWidth
        style={styles.doneButton}
      />
      {__DEV__ && diagnostics ? (
        <Card style={styles.debugCard}>
          <Text style={[styles.debugTitle, { color: colors.text }]}>Subscription diagnostics</Text>
          <Text style={[styles.debugLine, { color: colors.textSecondary }]}>
            init={String(diagnostics.initialized)} platform={diagnostics.platform}
          </Text>
          <Text style={[styles.debugLine, { color: colors.textSecondary }]}>
            billingConfigured={String(diagnostics.billingConfigured)} keySource={diagnostics.billingKeySource}
          </Text>
          <Text style={[styles.debugLine, { color: colors.textSecondary }]}>
            offeringsLoaded={String(diagnostics.offeringsLoaded)} entitlementActive={String(diagnostics.entitlementActive)}
          </Text>
          <Text style={[styles.debugLine, { color: colors.textSecondary }]}>
            lastError={diagnostics.lastError ?? 'none'}
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headline: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
    lineHeight: lineHeights.title,
    flexShrink: 1,
  },
  subheadline: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.lg,
    marginBottom: spacing.xl,
  },
  benefitsBlock: {
    marginBottom: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  benefitText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    flex: 1,
  },
  messageCard: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  restoreOutcomeTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.s,
  },
  messageButton: { marginTop: spacing.xs },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  loadingText: { fontSize: fontSizes.base },
  activatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  fallbackCard: {
    marginBottom: spacing.l,
    padding: spacing.m,
  },
  fallbackText: {
    fontSize: fontSizes.base,
    marginBottom: spacing.s,
  },
  fallbackButton: { marginTop: spacing.xs },
  plansBlock: {
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  planCard: {
    marginBottom: spacing.s,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  planInfo: { flex: 1 },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    flexWrap: 'wrap',
  },
  planLabel: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  bestValueBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  bestValueText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  planPrice: {
    fontSize: fontSizes.base,
    marginTop: spacing.xxs,
  },
  restoreTouchable: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  restoreText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  footerText: {
    fontSize: fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: 2,
  },
  legalLink: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  doneButton: { marginTop: spacing.xs },
  debugCard: { marginTop: spacing.l, padding: spacing.m },
  debugTitle: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, marginBottom: spacing.xs },
  debugLine: { fontSize: fontSizes.xs, marginBottom: spacing.xxs },
});
