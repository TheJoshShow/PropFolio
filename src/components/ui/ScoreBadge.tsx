import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Size = 'sm' | 'md';

type Props = {
  score: string | number;
  size?: Size;
  style?: StyleProp<ViewStyle>;
};

export function ScoreBadge({ score, size = 'md', style }: Props) {
  const label = typeof score === 'number' ? score.toFixed(1) : score;
  return (
    <View style={[styles.base, size === 'sm' && styles.sm, style]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.accentScoreMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentScore,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: spacing.xs,
    minWidth: 36,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.accentScore,
    fontVariant: ['tabular-nums'],
  },
  textSm: {
    fontSize: 14,
  },
});
