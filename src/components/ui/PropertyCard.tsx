import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import {
  portfolioScoreDescriptor,
  type PortfolioScoreTier,
} from '@/lib/portfolioScorePresentation';
import { iconSizes, radius, semantic, spacing, textPresets } from '@/theme';

import { Card } from './Card';
import { ScorePill } from './ScorePill';

export type PropertyCardProps = {
  address: string;
  rentLabel: string;
  priceLabel: string;
  scoreValue: number | null;
  scoreLabel: string;
  scoreLabelColor: string;
  scoreTier: PortfolioScoreTier;
  metricPreviewLabel: string;
  metricPreviewValue: string;
  onPress?: () => void;
  style?: ViewStyle;
};

function splitRentMo(label: string): { main: string; suffix: string } {
  const safe = label?.trim() ? label : '—';
  if (safe === '—') {
    return { main: '—', suffix: '' };
  }
  if (safe.endsWith('/mo')) {
    return { main: safe.slice(0, -3).trim(), suffix: '/mo' };
  }
  return { main: safe, suffix: '' };
}

/**
 * Portfolio property row — matches My Portfolio renders; safe with partial data.
 */
export function PropertyCard({
  address,
  rentLabel,
  priceLabel,
  scoreValue,
  scoreLabel,
  scoreLabelColor,
  scoreTier,
  metricPreviewLabel,
  metricPreviewValue,
  onPress,
  style,
}: PropertyCardProps) {
  const badgeScore = scoreValue ?? '—';
  const addr = address?.trim() ? address : 'Address unavailable';
  const price = priceLabel?.trim() ? priceLabel : '—';
  const metricLabel = metricPreviewLabel?.trim() ? metricPreviewLabel : 'Metric';
  const metricVal = metricPreviewValue?.trim() ? metricPreviewValue : '—';
  const descriptor = portfolioScoreDescriptor(scoreTier, scoreLabel);
  const { main: rentMain, suffix: rentSuffix } = splitRentMo(rentLabel);

  return (
    <Card onPress={onPress} elevation="sm" shape="sheet" style={[styles.card, style]}>
      <View style={styles.rowTop}>
        <Text style={styles.address} numberOfLines={2} ellipsizeMode="tail">
          {addr}
        </Text>
        <ScorePill score={badgeScore} />
      </View>

      <View style={styles.rowMoney}>
        <View style={styles.rentBlock}>
          <Text style={styles.moneyLabel}>Est. rent</Text>
          <Text style={styles.rentLine}>
            <Text style={styles.rentValue}>{rentMain}</Text>
            {rentSuffix ? <Text style={styles.rentSuffix}>{rentSuffix}</Text> : null}
          </Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.moneyLabel}>List / price</Text>
          <Text style={styles.priceValue} numberOfLines={1}>
            {price}
          </Text>
        </View>
      </View>

      <View style={styles.rowBottom}>
        <View style={styles.descriptor}>
          <Ionicons
            name="checkmark-circle"
            size={iconSizes.md}
            color={scoreLabelColor}
            style={styles.descriptorIcon}
          />
          <Text
            style={[styles.descriptorText, { color: scoreLabelColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {descriptor}
          </Text>
        </View>
        <View style={styles.metricRight}>
          <Ionicons name="stats-chart-outline" size={iconSizes.sm} color={semantic.textTertiary} />
          <Text style={styles.metricValue} numberOfLines={1} ellipsizeMode="tail">
            {metricVal}
          </Text>
          <Text style={styles.metricLabelTiny} numberOfLines={1} ellipsizeMode="tail">
            {metricLabel}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.card,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  address: {
    flex: 1,
    minWidth: 0,
    ...textPresets.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
    color: semantic.textPrimary,
  },
  rowMoney: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
  },
  rentBlock: {
    flex: 1,
    minWidth: 0,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  moneyLabel: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rentLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  rentValue: {
    fontSize: 22,
    fontWeight: '700',
    color: semantic.textPrimary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  rentSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textSecondary,
    marginLeft: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 40,
  },
  descriptor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  descriptorIcon: {
    marginTop: 1,
  },
  descriptorText: {
    ...textPresets.bodySecondary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '46%',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricLabelTiny: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    maxWidth: 72,
  },
});
