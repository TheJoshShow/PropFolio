import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Card } from './Card';

function SkeletonLine({ width, height = 14 }: { width: `${number}%` | number; height?: number }) {
  return (
    <View
      style={[
        styles.line,
        typeof width === 'string' ? { width } : { width },
        { height, borderRadius: height / 2 },
      ]}
    />
  );
}

function SkeletonCard() {
  return (
    <Card elevation="none" style={styles.card}>
      <View style={styles.top}>
        <View style={styles.leftCol}>
          <SkeletonLine width="88%" height={18} />
          <SkeletonLine width="55%" height={14} />
        </View>
        <View style={styles.badge}>
          <SkeletonLine width={40} height={22} />
          <SkeletonLine width={56} height={10} />
        </View>
      </View>
      <View style={styles.metrics}>
        <SkeletonLine width="42%" height={16} />
        <SkeletonLine width="42%" height={16} />
      </View>
      <View style={styles.footer}>
        <SkeletonLine width="35%" height={14} />
      </View>
    </Card>
  );
}

type Props = {
  count?: number;
};

/**
 * Loading placeholders matching portfolio card rhythm.
 */
export function PortfolioListSkeleton({ count = 5 }: Props) {
  return (
    <View style={styles.stack} accessibilityRole="progressbar" accessibilityLabel="Loading portfolio">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  line: {
    backgroundColor: colors.borderStrong,
    opacity: 0.45,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  leftCol: {
    flex: 1,
    gap: spacing.sm,
  },
  badge: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    width: 72,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.xl,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
