import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { heights, hitSlop, semantic, spacing, textPresets } from '@/theme';

type Props = {
  title: string;
  /** Left control — e.g. back chevron */
  left?: ReactNode;
  right?: ReactNode;
  style?: ViewStyle;
  /** When set, wraps `left` in a pressable with accessibility */
  onPressLeft?: () => void;
  leftAccessibilityLabel?: string;
};

/**
 * Simple top bar for modals / subflows — not a replacement for native stack headers.
 */
export function TopBar({
  title,
  left,
  right,
  style,
  onPressLeft,
  leftAccessibilityLabel = 'Go back',
}: Props) {
  const leftNode =
    left && onPressLeft ? (
      <Pressable
        onPress={onPressLeft}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={leftAccessibilityLabel}
        style={styles.leftTap}
      >
        {left}
      </Pressable>
    ) : (
      left
    );

  return (
    <View style={[styles.row, style]}>
      <View style={styles.side}>{leftNode}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: heights.topBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  side: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftTap: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...textPresets.bodyMedium,
    fontSize: 17,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
});
