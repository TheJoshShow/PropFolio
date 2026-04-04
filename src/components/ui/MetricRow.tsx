import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { heights, semantic, spacing, textPresets } from '@/theme';

type ValueTone = 'default' | 'success' | 'muted';

type Props = {
  label: string;
  value: string;
  leftIcon?: ReactNode;
  showSeparator?: boolean;
  valueTone?: ValueTone;
  style?: ViewStyle;
};

const toneColor: Record<ValueTone, string> = {
  default: semantic.textPrimary,
  success: semantic.success,
  muted: semantic.textTertiary,
};

/**
 * Icon + label + value row — property fact sheets, metric lists.
 */
export function MetricRow({
  label,
  value,
  leftIcon,
  showSeparator = true,
  valueTone = 'default',
  style,
}: Props) {
  return (
    <View
      style={[
        styles.row,
        showSeparator && styles.separator,
        style,
      ]}
    >
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : <View style={styles.iconSpacer} />}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.value, { color: toneColor[valueTone] }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: heights.metricRowMin,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  icon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 28,
  },
  label: {
    flex: 1,
    ...textPresets.body,
    fontSize: 16,
    color: semantic.textSecondary,
  },
  value: {
    ...textPresets.bodyMedium,
    fontSize: 16,
    textAlign: 'right',
    maxWidth: '48%',
    fontVariant: ['tabular-nums'],
  },
});
