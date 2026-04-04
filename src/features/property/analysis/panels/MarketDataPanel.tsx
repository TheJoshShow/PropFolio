import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, FinancialMetricRow } from '@/components/ui';
import { MARKET_ANALYSIS_EXTENSION_PLACEHOLDER } from '@/services/market-data';
import type { PropertySnapshotV1 } from '@/types/property';
import { iconSizes, semantic, spacing, textPresets } from '@/theme';

import { analysisPanelStyles } from '../analysisPanelTheme';
import { buildMarketSnapshotRows } from '../market/mapMarketDataRows';

type Props = {
  snapshot: PropertySnapshotV1 | null | undefined;
};

export function MarketDataPanel({ snapshot: snap }: Props) {
  const rows = useMemo(() => buildMarketSnapshotRows(snap ?? null), [snap]);

  const filledCount = useMemo(() => rows.filter((r) => r.value !== '—').length, [rows]);

  const dataHealthLine = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }
    if (filledCount === 0) {
      return 'No market fields were returned on import yet — add or refresh data from Adjust when available.';
    }
    if (filledCount < rows.length) {
      return `${filledCount} of ${rows.length} fields populated from this import. Missing values stay blank until data is available.`;
    }
    return null;
  }, [filledCount, rows.length]);

  return (
    <View style={analysisPanelStyles.wrap} testID="propfolio.analysis.market.panel">
      <Text style={analysisPanelStyles.intro}>
        Snapshot market data from your import and providers (deterministic display — no AI-generated stats).
      </Text>

      <Card elevation="sm" shape="sheet" style={analysisPanelStyles.sheetCard}>
        <View style={analysisPanelStyles.sheetCardInner}>
          {dataHealthLine ? (
            <View style={styles.hintBanner} accessibilityRole="text">
              <Ionicons name="information-circle-outline" size={iconSizes.md} color={semantic.textSecondary} />
              <Text style={styles.hintText}>{dataHealthLine}</Text>
            </View>
          ) : null}
          {rows.map((row, i) => (
            <FinancialMetricRow
              key={row.label}
              label={row.label}
              value={row.value}
              valueDetail={row.valueDetail}
              isFirst={i === 0}
            />
          ))}
        </View>
      </Card>

      <Card elevation="sm" shape="sheet" style={analysisPanelStyles.sheetCard}>
        <View style={analysisPanelStyles.sheetCardInner}>
          <View style={styles.extensionHead}>
            <Ionicons name="analytics-outline" size={iconSizes.md} color={semantic.textTertiary} />
            <Text style={styles.extensionTitle}>{MARKET_ANALYSIS_EXTENSION_PLACEHOLDER.title}</Text>
          </View>
          <Text style={styles.extensionLead}>
            These sections are not wired to live APIs in the MVP — the layout is reserved for future comps and trend
            feeds.
          </Text>
          {MARKET_ANALYSIS_EXTENSION_PLACEHOLDER.bullets.map((line, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>·</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
  },
  hintText: {
    flex: 1,
    ...textPresets.caption,
    color: semantic.textSecondary,
    lineHeight: 20,
  },
  extensionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  extensionTitle: {
    ...textPresets.bodyMedium,
    fontSize: 16,
    color: semantic.textPrimary,
  },
  extensionLead: {
    ...textPresets.bodySecondary,
    color: semantic.textTertiary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bulletDot: {
    ...textPresets.bodySecondary,
    color: semantic.textTertiary,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    ...textPresets.bodySecondary,
    color: semantic.textSecondary,
    lineHeight: 22,
  },
});
