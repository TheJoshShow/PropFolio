import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Card } from './Card';

export function PortfolioHeroSkeleton() {
  return (
    <Card elevation="sm" style={styles.card}>
      <View style={styles.row}>
        <Column />
        <View style={styles.divider} />
        <Column wide />
        <View style={styles.divider} />
        <Column />
      </View>
    </Card>
  );
}

function Column({ wide }: { wide?: boolean }) {
  return (
    <View style={styles.col}>
      <View style={[styles.line, styles.lineShort]} />
      <View style={[styles.line, wide ? styles.lineWide : styles.lineMid]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  col: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  line: {
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
    opacity: 0.45,
    alignSelf: 'flex-start',
  },
  lineShort: {
    height: 10,
    width: '70%',
  },
  lineMid: {
    height: 18,
    width: '85%',
  },
  lineWide: {
    height: 22,
    width: '95%',
  },
});
