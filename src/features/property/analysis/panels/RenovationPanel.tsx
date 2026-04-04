import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { AppButton, Card } from '@/components/ui';
import type { ScenarioPatch, ScoreBreakdown, UserAssumptionOverrides } from '@/scoring';
import type { PropertyRow } from '@/types/property';
import type { RenovationCategoryKey } from '@/types/renovationLedger';
import { formatCurrency } from '@/types/property';
import { hitSlop, heights, iconSizes, semantic, spacing, textPresets } from '@/theme';

import { analysisPanelStyles } from '../analysisPanelTheme';
import {
  buildRenovationLedgerRows,
  sumRenovationLedger,
  mergeRenovationLedger,
} from '../renovation/mapRenovationLedger';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  property: PropertyRow;
  userOverrides: UserAssumptionOverrides;
  breakdown: ScoreBreakdown | null;
  stressScenario: ScenarioPatch | null;
  setStressScenario: (s: ScenarioPatch | null) => void;
};

function formatRowValue(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) {
    return '—';
  }
  return formatCurrency(amount);
}

export function RenovationPanel({
  property,
  userOverrides,
  breakdown,
  stressScenario,
  setStressScenario,
}: Props) {
  const [expanded, setExpanded] = useState<Partial<Record<RenovationCategoryKey, boolean>>>({});

  const rows = useMemo(
    () => buildRenovationLedgerRows(property.snapshot, userOverrides.renovation),
    [property.snapshot, userOverrides.renovation],
  );

  const merged = useMemo(
    () => mergeRenovationLedger(property.snapshot, userOverrides.renovation),
    [property.snapshot, userOverrides.renovation],
  );

  const total = useMemo(() => sumRenovationLedger(merged), [merged]);

  const toggleRow = (key: RenovationCategoryKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rehabBase =
    breakdown != null ? Math.max(breakdown.effectiveInputs.rehabBudget ?? 0, 1) : 1;

  const applyRehabStress = (factor: number) => {
    setStressScenario({
      id: `reno-${factor}`,
      label:
        factor > 1 ? `Rehab +${Math.round((factor - 1) * 100)}%` : `Rehab ${Math.round(factor * 100)}%`,
      rehabBudget: rehabBase * factor,
    });
  };

  return (
    <View style={analysisPanelStyles.wrap} testID="propfolio.analysis.renovation.panel">
      <Text style={analysisPanelStyles.intro}>
        Renovation budget by category. Total is the sum of entered line items only — it does not pull a separate
        rehab figure unless those costs are captured below.
      </Text>
      <Card elevation="sm" shape="sheet" style={analysisPanelStyles.sheetCard}>
        <View style={analysisPanelStyles.sheetCardInner}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Renovation Costs</Text>
            <Text style={styles.totalValue} testID="propfolio.analysis.renovation.total">
              {total != null && Number.isFinite(total) ? formatCurrency(total) : '—'}
            </Text>
          </View>

          {rows.map((row, i) => {
            const isOpen = expanded[row.key] === true;
            return (
              <View key={row.key}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={`${row.label}${isOpen ? ', expanded' : ', collapsed'}`}
                  onPress={() => toggleRow(row.key)}
                  hitSlop={hitSlop}
                  style={({ pressed }) => [styles.catRow, i === 0 && styles.catRowFirst, pressed && styles.catPressed]}
                  testID={`propfolio.analysis.renovation.row.${row.key}`}
                >
                  <Text style={styles.catLabel} numberOfLines={3}>
                    {row.label}
                  </Text>
                  <View style={styles.catRight}>
                    <Text style={styles.catValue} numberOfLines={1}>
                      {formatRowValue(row.amount)}
                    </Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={iconSizes.md}
                      color={semantic.textSecondary}
                      style={styles.chevron}
                    />
                  </View>
                </Pressable>
                {isOpen ? (
                  <View style={styles.expandBody}>
                    <Text style={styles.expandHint}>
                      Line-item detail and editing will connect here — totals already reflect saved snapshot and device
                      overrides.
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      {breakdown ? (
        <View style={styles.stressBlock}>
          <Text style={styles.stressTitle}>Scoring rehab stress (optional)</Text>
          <Text style={styles.stressHelp}>
            Adjusts modeled rehab in the engine only — independent of the line-item total above. Save to persist with
            this property.
            {stressScenario ? ` Active: ${stressScenario.label}.` : ''}
          </Text>
          <View style={styles.stressRow}>
            <AppButton
              label="−20% rehab"
              variant="secondary"
              onPress={() => applyRehabStress(0.8)}
              style={styles.stressBtn}
            />
            <AppButton label="Baseline" variant="ghost" onPress={() => setStressScenario(null)} style={styles.stressBtn} />
            <AppButton
              label="+20% rehab"
              variant="secondary"
              onPress={() => applyRehabStress(1.2)}
              style={styles.stressBtn}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  totalRow: {
    minHeight: heights.metricRowMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
    marginBottom: spacing.xxs,
  },
  totalLabel: {
    flex: 1,
    ...textPresets.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: semantic.textPrimary,
  },
  totalValue: {
    ...textPresets.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  catRow: {
    minHeight: heights.metricRowMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  catRowFirst: {
    borderTopWidth: 0,
  },
  catPressed: {
    opacity: 0.85,
  },
  catLabel: {
    flex: 1,
    minWidth: 0,
    ...textPresets.body,
    fontSize: 16,
    lineHeight: 22,
    color: semantic.textSecondary,
    paddingRight: spacing.sm,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    maxWidth: '46%',
    gap: spacing.sm,
  },
  catValue: {
    ...textPresets.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    marginTop: 0,
  },
  expandBody: {
    paddingLeft: spacing.xs,
    paddingRight: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: 0,
  },
  expandHint: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    lineHeight: 18,
  },
  stressBlock: {
    gap: spacing.sm,
  },
  stressTitle: {
    ...textPresets.sectionTitle,
    marginTop: spacing.sm,
    color: semantic.textPrimary,
  },
  stressHelp: {
    ...textPresets.caption,
    color: semantic.textTertiary,
    lineHeight: 18,
  },
  stressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stressBtn: {
    minWidth: 112,
    flexGrow: 1,
  },
});
