import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { heights, hitSlop, iconSizes, semantic, spacing, textPresets } from '@/theme';

type Props = {
  label: string;
  value?: string;
  leftIcon?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isFirst?: boolean;
  style?: ViewStyle;
};

export function SettingsRow({
  label,
  value,
  leftIcon,
  showChevron = true,
  onPress,
  isFirst,
  style,
}: Props) {
  const content = (
    <>
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <View style={styles.main}>
        <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
          {label}
        </Text>
        {value ? (
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {value}
          </Text>
        ) : null}
      </View>
      {onPress && showChevron ? (
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
        </View>
      ) : null}
    </>
  );

  const rowPad = [styles.row, !isFirst && styles.rowDivider, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : label}
        onPress={onPress}
        hitSlop={hitSlop}
        style={({ pressed }) => [rowPad, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowPad}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: heights.listRowMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  pressed: {
    backgroundColor: semantic.surfaceMuted,
  },
  icon: {
    marginRight: spacing.md,
    width: 28,
    alignItems: 'center',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minWidth: 0,
  },
  label: {
    ...textPresets.body,
    color: semantic.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  value: {
    ...textPresets.caption,
    color: semantic.textSecondary,
    flexShrink: 0,
    maxWidth: '42%',
    textAlign: 'right',
  },
  chevronWrap: {
    width: 28,
    marginLeft: spacing.xs,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
