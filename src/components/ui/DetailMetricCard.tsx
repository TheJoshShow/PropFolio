import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme';

import { Card } from './Card';

type Props = {
  label: string;
  value: string;
  /** Shown under value when metric is thin or missing drivers */
  hint?: string;
  /** Emphasis tier for primary deal metrics */
  emphasis?: 'default' | 'primary';
  /** Full-width row vs two-up grid */
  layout?: 'grid' | 'full';
  footer?: ReactNode;
  style?: ViewStyle;
};

/**
 * Property detail metric tile — readable at a glance, optional data-quality hint.
 */
export function DetailMetricCard({
  label,
  value,
  hint,
  emphasis = 'default',
  layout = 'grid',
  footer,
  style,
}: Props) {
  const isThin = value === '—';

  return (
    <Card
      elevation="xs"
      style={[styles.card, layout === 'full' && styles.cardFull, emphasis === 'primary' && styles.cardPrimary, style]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, emphasis === 'primary' && styles.valuePrimary, isThin && styles.valueMuted]}
        numberOfLines={2}
      >
        {value}
      </Text>
      {hint ? (
        <Text style={styles.hint} numberOfLines={4}>
          {hint}
        </Text>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexGrow: 1,
    minWidth: '47%',
    maxWidth: '48%',
  },
  cardFull: {
    minWidth: '100%',
    maxWidth: '100%',
    width: '100%',
  },
  cardPrimary: {
    borderColor: colors.accentScore,
    backgroundColor: colors.surfaceCard,
  },
  label: {
    ...typography.metricLabel,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  valuePrimary: {
    fontSize: 22,
    fontWeight: '700',
  },
  valueMuted: {
    color: colors.textMuted,
  },
  hint: {
    ...typography.captionSmall,
    color: colors.warning,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  footer: {
    marginTop: spacing.sm,
  },
});
