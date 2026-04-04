import { StyleSheet, Text, View } from 'react-native';

import { Card, DetailMetricCard } from '@/components/ui';
import type { FinancialPanelKind } from '../resolveFinancialPanelKind';
import { formatCalculatedMetric, metricFootnote } from '@/features/property/detail/formatCalculatedMetric';
import type { ScoreBreakdown } from '@/scoring';
import { formatCurrency, type PropertyRow } from '@/types/property';
import { semantic, spacing, textPresets } from '@/theme';

const FINANCIAL_KEYS = [
  'cap_rate',
  'cash_flow_annual',
  'arv',
  'noi_annual',
  'dscr',
  'cash_on_cash',
] as const;

type FinancialKey = (typeof FINANCIAL_KEYS)[number];

function financialKeyOrder(strategy: PropertyRow['snapshot']['investmentStrategy']): FinancialKey[] {
  if (strategy === 'fix_flip') {
    return ['arv', 'cash_on_cash', 'cap_rate', 'noi_annual', 'cash_flow_annual', 'dscr'];
  }
  return ['cap_rate', 'cash_flow_annual', 'dscr', 'noi_annual', 'cash_on_cash', 'arv'];
}

function primaryFinancialKeys(strategy: PropertyRow['snapshot']['investmentStrategy']): Set<FinancialKey> {
  if (strategy === 'fix_flip') {
    return new Set<FinancialKey>(['arv', 'cash_on_cash']);
  }
  return new Set<FinancialKey>(['cap_rate', 'cash_flow_annual']);
}

function panelIntroCopy(
  variant: FinancialPanelKind,
  snapshotStrategy: PropertyRow['snapshot']['investmentStrategy'],
): string {
  if (variant === 'fix_flip') {
    return 'Fix & flip financials — ARV and exit economics emphasized (deterministic — no AI math). Deeper split panels land next.';
  }
  if (variant === 'buy_hold') {
    return 'Buy & hold financials — cash flow and yield emphasized (deterministic — no AI math). Deeper split panels land next.';
  }
  return snapshotStrategy == null
    ? 'Core metrics (deterministic — no AI math). Strategy not set on this property — assumptions may not match intent.'
    : 'Core metrics (deterministic — no AI math).';
}

type Props = {
  variant: FinancialPanelKind;
  property: PropertyRow;
  breakdown: ScoreBreakdown;
};

/**
 * Single deterministic metrics body for all strategy kinds today; `variant` selects copy and ordering hooks for later split UIs.
 */
export function SharedFinancialMetricsPanel({ variant, property, breakdown }: Props) {
  const invStrategy = property.snapshot?.investmentStrategy;
  const metricsByKey = Object.fromEntries(breakdown.primaryMetrics.map((m) => [m.key, m]));
  const orderedFinancialKeys = financialKeyOrder(invStrategy);
  const primaryFinancialKeySet = primaryFinancialKeys(invStrategy);

  return (
    <View style={styles.tabPanel}>
      <Text style={styles.panelIntro}>{panelIntroCopy(variant, invStrategy)}</Text>
      <View style={styles.metricGrid}>
        {orderedFinancialKeys.map((key) => {
          const m = metricsByKey[key];
          if (!m) {
            return null;
          }
          const primary = primaryFinancialKeySet.has(key);
          const cfMonthly =
            key === 'cash_flow_annual' && m.value != null && Number.isFinite(m.value) ? (
              <Text style={styles.metricFooterText}>
                ≈ {formatCurrency(m.value / 12)}/mo levered
              </Text>
            ) : undefined;
          return (
            <DetailMetricCard
              key={key}
              label={m.label}
              value={formatCalculatedMetric(m)}
              hint={metricFootnote(m)}
              emphasis={primary ? 'primary' : 'default'}
              footer={cfMonthly}
            />
          );
        })}
      </View>

      <Text style={styles.subsection}>Score breakdown</Text>
      <View style={styles.factorStack}>
        {breakdown.factors.map((f) => (
          <Card key={f.id} elevation="none" style={styles.factorCard}>
            <View style={styles.factorTop}>
              <Text style={styles.factorLabel}>{f.label}</Text>
              <Text style={styles.factorScore}>{f.score}</Text>
            </View>
            <Text style={styles.factorNarrative}>{f.narrative}</Text>
          </Card>
        ))}
      </View>

      <Text style={styles.subsection}>Confidence</Text>
      <Card elevation="xs" style={styles.confidenceCard}>
        <Text style={styles.confidenceScore}>
          {breakdown.confidence.score.toFixed(1)} / {breakdown.confidence.max}
        </Text>
        <Text style={styles.confidenceExpl}>
          Confidence starts at {breakdown.confidence.base} and subtracts for missing purchase price, rent, tax,
          insurance, sqft, and ARV when rehab is set. Tune penalties in scoring defaults — not here.
        </Text>
        {breakdown.confidence.penalties.length > 0 ? (
          <View style={styles.penaltyList}>
            {breakdown.confidence.penalties.map((p) => (
              <Text key={p.code} style={styles.penaltyLine}>
                −{p.deduction.toFixed(2)} · {p.label}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.penaltyNone}>No deductions — strong input coverage.</Text>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  tabPanel: {
    gap: spacing.md,
  },
  panelIntro: {
    ...textPresets.bodySecondary,
    marginBottom: spacing.xs,
    color: semantic.textSecondary,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricFooterText: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
  },
  subsection: {
    ...textPresets.sectionTitle,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  factorStack: {
    gap: spacing.sm,
  },
  factorCard: {
    padding: spacing.md,
    backgroundColor: semantic.surfaceMuted,
    borderColor: semantic.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  factorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  factorLabel: {
    ...textPresets.bodyMedium,
    flex: 1,
    color: semantic.textPrimary,
  },
  factorScore: {
    fontSize: 18,
    fontWeight: '700',
    color: semantic.accentScore,
    fontVariant: ['tabular-nums'],
  },
  factorNarrative: {
    ...textPresets.caption,
    color: semantic.textSecondary,
  },
  confidenceCard: {
    padding: spacing.lg,
  },
  confidenceScore: {
    fontSize: 28,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginBottom: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  confidenceExpl: {
    ...textPresets.bodySecondary,
    marginBottom: spacing.md,
    color: semantic.textSecondary,
  },
  penaltyList: {
    gap: spacing.xs,
  },
  penaltyLine: {
    ...textPresets.caption,
    color: semantic.textSecondary,
  },
  penaltyNone: {
    ...textPresets.caption,
    color: semantic.success,
  },
});
