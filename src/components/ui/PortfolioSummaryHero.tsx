import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { formatCurrency } from '@/types/property';
import { colors, spacing, typography } from '@/theme';

import { Card } from './Card';

type Props = {
  propertyCount: number;
  totalValueFormatted: string;
  monthlyCashFlowFormatted: string | null;
  /** When cash flow omitted (no computable rows), show subtle hint */
  cashFlowHint?: string;
  style?: ViewStyle;
};

/**
 * Single premium summary strip — white card, strong typographic hierarchy.
 */
export function PortfolioSummaryHero({
  propertyCount,
  totalValueFormatted,
  monthlyCashFlowFormatted,
  cashFlowHint,
  style,
}: Props) {
  return (
    <Card elevation="sm" style={[styles.wrap, style]}>
      <View style={styles.row}>
        <StatBlock label="Properties" value={String(propertyCount)} />
        <View style={styles.divider} />
        <StatBlock label="Est. value" value={totalValueFormatted} emphasize />
        <View style={styles.divider} />
        <StatBlock
          label="Est. cash flow"
          value={monthlyCashFlowFormatted ?? '—'}
          sub={cashFlowHint}
          valueTone={
            monthlyCashFlowFormatted == null
              ? 'muted'
              : monthlyCashFlowFormatted.startsWith('+')
                ? 'positive'
                : monthlyCashFlowFormatted.startsWith('-')
                  ? 'negative'
                  : 'default'
          }
        />
      </View>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  emphasize,
  sub,
  valueTone = 'default',
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  sub?: string;
  valueTone?: 'default' | 'positive' | 'negative' | 'muted';
}) {
  const valueColor =
    valueTone === 'positive'
      ? colors.success
      : valueTone === 'negative'
        ? colors.danger
        : valueTone === 'muted'
          ? colors.textMuted
          : colors.textPrimary;

  return (
    <View style={styles.block}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          emphasize && styles.statValueEmphasis,
          { color: valueColor },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

/** Convenience for parent screens */
export function formatPortfolioValue(n: number | null): string {
  if (n == null || !Number.isFinite(n)) {
    return '—';
  }
  return formatCurrency(n);
}

export function formatSignedMonthlyFlow(n: number | null): string | null {
  if (n == null || !Number.isFinite(n)) {
    return null;
  }
  const abs = formatCurrency(Math.abs(n));
  if (n > 0) {
    return `+${abs}/mo`;
  }
  if (n < 0) {
    return `-${abs}/mo`;
  }
  return `${abs}/mo`;
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  block: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  statLabel: {
    ...typography.metricLabel,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.35,
    fontVariant: ['tabular-nums'],
  },
  statValueEmphasis: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statSub: {
    ...typography.captionSmall,
    marginTop: spacing.micro,
  },
});
