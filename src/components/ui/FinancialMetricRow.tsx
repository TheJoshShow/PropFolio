import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { heights, semantic, spacing, textPresets } from '@/theme';

type Props = {
  label: string;
  value: string;
  /** Optional second line under the value (e.g. monthly hint). */
  valueDetail?: string;
  isFirst?: boolean;
  style?: ViewStyle;
};

/**
 * Analysis-style fact row: label left, value right, stable alignment for long labels.
 */
export function FinancialMetricRow({ label, value, valueDetail, isFirst, style }: Props) {
  const alignRow = valueDetail ? styles.rowAlignStart : styles.rowAlignCenter;
  return (
    <View style={[styles.row, alignRow, !isFirst && styles.separator, style]}>
      <Text style={styles.label} numberOfLines={4}>
        {label}
      </Text>
      <View style={styles.valueCol}>
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
        {valueDetail ? (
          <Text style={styles.valueDetail} numberOfLines={2}>
            {valueDetail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: heights.metricRowMin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowAlignCenter: {
    alignItems: 'center',
  },
  rowAlignStart: {
    alignItems: 'flex-start',
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  label: {
    flex: 1,
    minWidth: 0,
    ...textPresets.body,
    fontSize: 16,
    lineHeight: 22,
    color: semantic.textSecondary,
    paddingRight: spacing.sm,
  },
  valueCol: {
    flexShrink: 0,
    maxWidth: '46%',
    alignItems: 'flex-end',
  },
  value: {
    ...textPresets.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  valueDetail: {
    ...textPresets.captionSmall,
    marginTop: spacing.xxs,
    textAlign: 'right',
    color: semantic.textTertiary,
    fontVariant: ['tabular-nums'],
  },
});
