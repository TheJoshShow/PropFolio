import { StyleSheet, Text, View } from 'react-native';

import { radius, semantic, spacing, textPresets } from '@/theme';

type Props = {
  /** Formatted total (e.g. from `formatPortfolioValue`) or "—" when unknown */
  totalValueFormatted: string;
};

/**
 * Bottom portfolio strip: total estimated value, matches My Portfolio renders.
 */
export function PortfolioSummaryRow({ totalValueFormatted }: Props) {
  const value = totalValueFormatted?.trim() ? totalValueFormatted : '—';
  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`Total portfolio value, ${value}`}
    >
      <Text style={styles.label}>Total portfolio value</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: semantic.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    gap: spacing.md,
  },
  label: {
    ...textPresets.bodySecondary,
    fontSize: 15,
    fontWeight: '600',
    color: semantic.textSecondary,
    flexShrink: 1,
  },
  value: {
    ...textPresets.bodyMedium,
    fontSize: 18,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },
});
