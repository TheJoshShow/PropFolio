/**
 * Displays current plan, entitlement, renewal when available, and remaining free imports.
 * UI-safe props only; no raw RevenueCat objects. Handles loading and error states.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { useThemeColors } from './useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights } from '../theme';
import type { SubscriptionStatusDisplay } from '../services/subscriptionStatusDisplay';

export interface SubscriptionStatusCardProps {
  /** From useSubscription().subscriptionStatus */
  status: SubscriptionStatusDisplay;
  /** From useImportLimit() */
  importCount: number;
  /** From useImportLimit() */
  freeRemaining: number;
  /** Import limit for free tier (e.g. 2) */
  freeLimit: number;
  /** Show loading skeleton/spinner */
  isLoading?: boolean;
  /** Show error and retry when set */
  error?: string | null;
  /** Called when user taps retry */
  onRetry?: () => void;
}

export function SubscriptionStatusCard({
  status,
  importCount,
  freeRemaining,
  freeLimit,
  isLoading = false,
  error = null,
  onRetry,
}: SubscriptionStatusCardProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading subscription…
          </Text>
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        {onRetry ? (
          <Button title="Try again" onPress={onRetry} variant="secondary" fullWidth style={styles.retryButton} />
        ) : null}
      </Card>
    );
  }

  const entitlementLabel = status.entitlementActive ? 'Active' : 'Inactive';
  const importsLabel = status.isPro
    ? 'Unlimited'
    : `${freeRemaining} of ${freeLimit} free imports left`;
  const isExpired = !status.entitlementActive && status.renewalOrExpirationLabel != null;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Current plan</Text>
        <Text style={[styles.value, { color: colors.text }]}>{status.planName}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Entitlement</Text>
        <Text style={[styles.value, { color: colors.text }]}>{entitlementLabel}</Text>
      </View>
      {status.renewalOrExpirationLabel ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {status.entitlementActive ? 'Renewal' : 'Expired'}
          </Text>
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
            {status.renewalOrExpirationLabel}
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Property imports</Text>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
          {importsLabel}
        </Text>
      </View>
      {isExpired && (
        <Text style={[styles.expiredHint, { color: colors.textMuted }]}>
          You can resubscribe anytime from the paywall or when adding a property.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.s },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.s,
  },
  label: { fontSize: fontSizes.sm },
  value: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, flex: 1, textAlign: 'right' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  loadingText: { fontSize: fontSizes.base },
  errorText: { fontSize: fontSizes.sm, lineHeight: lineHeights.sm, marginBottom: spacing.s },
  retryButton: { marginTop: spacing.xs },
  expiredHint: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
});
