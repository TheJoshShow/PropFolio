import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { Card } from './Card';
import { ScoreBadge } from './ScoreBadge';
import { spacing, fontSizes, fontWeights } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface PropertySummaryCardProps extends ViewProps {
  addressLine: string;
  secondaryLine?: string;
  score: number | null;
  leftMetricLabel: string;
  leftMetricValue: string;
  rightMetricLabel: string;
  rightMetricValue: string;
}

/**
 * Top summary card on the analysis screen: address + score + primary metrics.
 * Purely presentational: values are computed upstream.
 */
export function PropertySummaryCard({
  addressLine,
  secondaryLine,
  score,
  leftMetricLabel,
  leftMetricValue,
  rightMetricLabel,
  rightMetricValue,
  style,
  ...rest
}: PropertySummaryCardProps) {
  const colors = useThemeColors();

  return (
    <Card elevated style={[styles.card, style]} {...rest}>
      <View style={styles.topRow}>
        <View style={styles.addressBlock}>
          <Text style={[styles.address, { color: colors.text }]} numberOfLines={1} allowFontScaling>
            {addressLine}
          </Text>
          {secondaryLine ? (
            <Text
              style={[styles.secondary, { color: colors.textSecondary }]}
              numberOfLines={1}
              allowFontScaling
            >
              {secondaryLine}
            </Text>
          ) : null}
        </View>
        <ScoreBadge value={score} />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]} allowFontScaling>
            {leftMetricLabel}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
            {leftMetricValue}
          </Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]} allowFontScaling>
            {rightMetricLabel}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
            {rightMetricValue}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.l,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  addressBlock: {
    flex: 1,
    marginRight: spacing.m,
  },
  address: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  secondary: {
    marginTop: spacing.xxs,
    fontSize: fontSizes.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    fontSize: fontSizes.sm,
  },
  metricValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.xxs,
  },
});

