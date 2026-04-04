import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme';

import { Card } from './Card';
import { ScoreBadge } from './ScoreBadge';

type Props = {
  address: string;
  score: string | number;
  rentLabel: string;
  valueLabel: string;
  tags?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function PropertySummaryCard({
  address,
  score,
  rentLabel,
  valueLabel,
  tags,
  onPress,
  style,
}: Props) {
  return (
    <Card onPress={onPress} elevation="sm" style={[styles.card, style]}>
      <View style={styles.top}>
        <Text style={styles.address} numberOfLines={2}>
          {address}
        </Text>
        <ScoreBadge score={score} size="sm" />
      </View>
      <View style={styles.metrics}>
        <View>
          <Text style={styles.metricLabel}>Rent</Text>
          <Text style={styles.metricValue}>{rentLabel}</Text>
        </View>
        <View style={styles.metricRight}>
          <Text style={styles.metricLabel}>Value</Text>
          <Text style={styles.metricValue}>{valueLabel}</Text>
        </View>
      </View>
      {tags ? <View style={styles.tags}>{tags}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  address: {
    ...typography.bodyMedium,
    flex: 1,
    color: colors.textPrimary,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    ...typography.metricLabel,
    marginBottom: spacing.xxs,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.25,
    fontVariant: ['tabular-nums'],
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
