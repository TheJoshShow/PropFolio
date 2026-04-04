import { StyleSheet, View } from 'react-native';

import { Card, MetricRow } from '@/components/ui';
import { radius, semantic, spacing } from '@/theme';

import type { AnalysisSummaryRow } from './buildPropertyAnalysisSummary';

type Props = {
  rows: AnalysisSummaryRow[];
};

export function AnalysisSummaryCard({ rows }: Props) {
  return (
    <Card elevation="sm" shape="sheet" style={styles.card} testID="propfolio.analysis.summaryCard">
      <View style={styles.inner}>
        {rows.map((row, index) => (
          <MetricRow
            key={row.label}
            label={row.label}
            value={row.value}
            showSeparator={index > 0}
            valueTone="default"
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: semantic.surface,
    borderRadius: radius.card,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
