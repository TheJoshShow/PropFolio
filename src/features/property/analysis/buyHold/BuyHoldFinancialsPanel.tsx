import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { Card, FinancialMetricRow } from '@/components/ui';
import type { ScoreBreakdown } from '@/scoring';
import { hitSlop, iconSizes, semantic } from '@/theme';

import { analysisPanelStyles } from '../analysisPanelTheme';
import {
  buildBuyHoldPrimaryRows,
  buildBuyHoldSecondaryRows,
} from './mapBuyHoldFinancialMetrics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  breakdown: ScoreBreakdown;
};

export function BuyHoldFinancialsPanel({ breakdown }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = useMemo(() => buildBuyHoldPrimaryRows(breakdown), [breakdown]);
  const secondary = useMemo(() => buildBuyHoldSecondaryRows(breakdown), [breakdown]);

  const toggleMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMoreOpen((v) => !v);
  };

  return (
    <View style={analysisPanelStyles.wrap} testID="propfolio.analysis.buyhold.financials">
      <Text style={analysisPanelStyles.intro}>
        Buy &amp; hold financials — deterministic metrics from your assumptions and import data (no AI math).
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
            testID="propfolio.analysis.buyhold.moreToggle"
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
