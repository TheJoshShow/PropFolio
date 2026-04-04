import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { semantic, spacing, textPresets } from '@/theme';

type Props = {
  message?: string;
  style?: ViewStyle;
};

export function LoadingState({ message = 'Loading…', style }: Props) {
  return (
    <View style={[styles.wrap, style]} accessibilityLabel={message}>
      <ActivityIndicator size="large" color={semantic.accentGold} />
      {message ? <Text style={styles.caption}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  caption: {
    ...textPresets.caption,
    color: semantic.textTertiary,
  },
});
