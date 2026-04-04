import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ScoreBadge } from './ScoreBadge';

type Props = {
  score: string | number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Portfolio score pill — alias of `ScoreBadge` for list alignment / DS naming.
 */
export function ScorePill({ score, style }: Props) {
  return <ScoreBadge score={score} size="md" style={[styles.pill, style]} />;
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 48,
    alignSelf: 'flex-start',
  },
});
