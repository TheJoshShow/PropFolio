import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { Card, FinancialMetricRow } from '@/components/ui';
import type { ScoreBreakdown } from '@/scoring';
import type { PropertyRow } from '@/types/property';
import { hitSlop, iconSizes, semantic } from '@/theme';

import { analysisPanelStyles } from '../analysisPanelTheme';
import { buildFixFlipPrimaryRows, buildFixFlipSecondaryRows } from './mapFixFlipFinancialMetrics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  breakdown: ScoreBreakdown;
  property: PropertyRow;
};

export function FixFlipFinancialsPanel({ breakdown, property }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = useMemo(
    () => buildFixFlipPrimaryRows(breakdown, property),
    [breakdown, property],
  );
  const secondary = useMemo(() => buildFixFlipSecondaryRows(breakdown), [breakdown]);

  const toggleMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMoreOpen((v) => !v);
  };

  return (
    <View style={analysisPanelStyles.wrap} testID="propfolio.analysis.fixflip.financials">
      <Text style={analysisPanelStyles.intro}>
        Fix &amp; flip financials — ARV-driven view with modeled MAO/ROI (deterministic — no AI math). Tune inputs in
        Adjust; listing DOM when available.
      </Text>
      <Card elevation="sm" shape="sheet" style={analysisPanelStyles.sheetCard}>
        <View style={analysisPanelStyles.sheetCardInner}>
          {primary.map((row, i) => (
            <FinancialMetricRow
              key={row.label}
              label={row.label}
              value={row.value}
              valueDetail={row.valueDetail}
              isFirst={i === 0}
            />
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: moreOpen }}
            accessibilityLabel={moreOpen ? 'Hide more metrics' : 'Show more metrics'}
            onPress={toggleMore}
            hitSlop={hitSlop}
            style={({ pressed }) => [
              analysisPanelStyles.moreRow,
              pressed && analysisPanelStyles.morePressed,
            ]}
            testID="propfolio.analysis.fixflip.moreToggle"
          >
            <Text style={analysisPanelStyles.moreLabel}>Show More Metrics</Text>
            <Ionicons
              name={moreOpen ? 'chevron-up' : 'chevron-down'}
              size={iconSizes.md}
              color={semantic.textSecondary}
            />
          </Pressable>

          {moreOpen
            ? secondary.map((row, i) => (
                <FinancialMetricRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  valueDetail={row.valueDetail}
                  isFirst={i === 0}
                />
              ))
            : null}
        </View>
      </Card>
    </View>
  );
}
