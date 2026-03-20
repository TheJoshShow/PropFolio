/**
 * Reusable indicator for remaining free imports. Keeps copy consistent and tone appropriate.
 * Hide for Pro users. Uses centralized usage data passed as props (no duplicate fetching).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from './useThemeColors';
import { spacing, fontSizes, lineHeights } from '../theme';

export interface FreeImportsIndicatorProps {
  /** Number of free imports left (0, 1, or 2). */
  freeRemaining: number;
  /** Free tier limit (e.g. 2). */
  limit: number;
  /** When true, hide the indicator (paid users). */
  isPro: boolean;
  /** When true, show minimal or no content to avoid flashing. */
  isLoading?: boolean;
  /** Compact single line (default) or inline with slightly more context. */
  variant?: 'default' | 'compact';
}

function getCopy(freeRemaining: number, limit: number): { line: string; isUrgent: boolean } {
  if (freeRemaining >= limit) {
    return { line: `${limit} free imports remaining`, isUrgent: false };
  }
  if (freeRemaining === 1) {
    return { line: '1 free import remaining', isUrgent: true };
  }
  if (freeRemaining === 0) {
    return { line: `You've used your ${limit} free imports`, isUrgent: true };
  }
  return { line: `${freeRemaining} free imports remaining`, isUrgent: false };
}

export function FreeImportsIndicator({
  freeRemaining,
  limit,
  isPro,
  isLoading = false,
  variant = 'default',
}: FreeImportsIndicatorProps) {
  const colors = useThemeColors();

  if (isPro) return null;
  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <Text style={[styles.text, { color: colors.textMuted }]}>…</Text>
      </View>
    );
  }

  const { line, isUrgent } = getCopy(freeRemaining, limit);
  const textColor = isUrgent ? colors.warning : colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.text, variant === 'compact' ? styles.compact : undefined, { color: textColor }]}>
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.s,
  },
  text: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  compact: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
});
