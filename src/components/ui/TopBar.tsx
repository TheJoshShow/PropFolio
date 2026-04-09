import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { HeaderActionSpacer } from '@/components/navigation';
import { hitSlop, navigationChrome, semantic, textPresets } from '@/theme';

const SLOT = navigationChrome.headerActionSlotWidth;

type Props = {
  title: string;
  /** Left control — e.g. `HeaderIconButton` / `AppBackButton` */
  left?: ReactNode;
  right?: ReactNode;
  style?: ViewStyle;
  /** When set, wraps `left` in a pressable with accessibility */
  onPressLeft?: () => void;
  leftAccessibilityLabel?: string;
};

/**
 * Simple top bar for modals / subflows — balanced slots match `HeaderIconButton` / native stack.
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
      <View style={styles.side}>{leftNode ?? <HeaderActionSpacer />}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right ?? <HeaderActionSpacer />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: navigationChrome.headerActionMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: navigationChrome.headerBarEdgePadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  side: {
    width: SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftTap: {
    minWidth: SLOT,
    minHeight: SLOT,
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
