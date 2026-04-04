import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, hitSlop, layout, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
};

export function TabPill({ label, selected, onPress, style, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      hitSlop={hitSlop}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && !selected && styles.pillPressed,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

type RowProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Horizontal row with consistent gap; parent owns selection state. */
export function TabPillRow({ children, style }: RowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  pill: {
    minHeight: layout.minTapSize,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.accentScoreMuted,
    borderColor: colors.accentScore,
  },
  pillPressed: {
    opacity: 0.92,
  },
  label: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
