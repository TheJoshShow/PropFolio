import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

import { Card } from './Card';

type Props = {
  label: string;
  value: string;
  /** e.g. success tint for NOI */
  valueTone?: 'default' | 'success' | 'warning';
  footer?: ReactNode;
  style?: ViewStyle;
};

export function MetricCard({ label, value, valueTone = 'default', footer, style }: Props) {
  const valueColor =
    valueTone === 'success'
      ? colors.success
      : valueTone === 'warning'
        ? colors.warning
        : colors.textPrimary;

  return (
    <Card elevation="xs" style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.metricLabel,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    marginTop: spacing.sm,
  },
});
