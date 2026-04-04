import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { heights, hitSlop, semantic, spacing, textPresets } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  showSeparator?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Settings / drill-in row — label + optional value + chevron.
 */
export function ListRow({
  title,
  subtitle,
  leftIcon,
  value,
  onPress,
  showChevron = Boolean(onPress),
  showSeparator = true,
  style,
  testID,
}: Props) {
  const inner = (
    <>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <View style={styles.textBlock}>
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={semantic.textTertiary} style={styles.chev} />
      ) : null}
    </>
  );

  const rowStyles = [styles.row, showSeparator && styles.separator, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={hitSlop}
        testID={testID}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={rowStyles}>{inner}</View>
      </Pressable>
    );
  }

  return <View style={rowStyles}>{inner}</View>;
}

const styles = StyleSheet.create({
  row: {
    minHeight: heights.listRowMin,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
  },
  pressed: {
    opacity: 0.92,
  },
  leftIcon: {
    width: 28,
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    ...textPresets.bodyMedium,
    fontSize: 17,
    color: semantic.textPrimary,
  },
  subtitle: {
    ...textPresets.caption,
    marginTop: spacing.xxs,
    color: semantic.textSecondary,
  },
  value: {
    ...textPresets.bodySecondary,
    fontSize: 15,
    color: semantic.textTertiary,
    maxWidth: '40%',
  },
  chev: {
    marginLeft: spacing.xxs,
  },
});
